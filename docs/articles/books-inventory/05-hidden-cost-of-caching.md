---
title: "the hidden cost of caching: detecting stale reads with locust"
date: 2025-05-30
category:
  - systemdesign
series:
  name: "a hands-on guide to modern software development"
  episode: 5
order: 5
tag:
  - systemdesign
  - webdev
  - locust
  - loadtesting
  - caching
summary: "Explore how stale cache data can impact your system and how to detect it with Locust."
---

<ArticleStatusBadge/>

<img class="cover-image" src="../../.assets/books-inventory/architecture-load-testing.svg"/>

# the hidden cost of caching: detecting stale reads with Locust

## stale reads are real

Update a record. Refresh the page. Still see the old value? That’s not just annoying - it’s a sign your cache lied to you.

### what is a stale cache?

A **stale cache** returns outdated data even after the source has changed. It’s a silent failure that misleads users and systems.

Common causes:

- **Race conditions**:
  A GET request reads from the cache right before a PUT updates it.

- **Delayed expiration**:
  A record was updated, but the cache still holds the old value because its TTL hasn’t expired.

- **Distributed lag**:
  One cache node got the update, but another one didn’t — and it serves the old data.

### why it matters

It's not just what users see, stale data misleads everything that depends on it:

- Business logic runs on old values
- Dashboards show records that no longer exist
- Users lose trust when updates don't stick

Most systems tolerate a bit of staleness. But if you want to **see** it happen, you need pressure.

## how to detect stale caches

We built a simple visibility mechanism:

1. **simulate load**: call the same book record with concurrent updates and reads
2. **track updates**: embed a counter in the book’s title
3. **detect mismatch**: if a read returns an older counter than the latest write → stale cache

```text
✅ match → consistent
❌ lower counter → stale
```

> ⚠️ This technique only works reliably in **single-process tests**. Distributed workers don’t share state, so each gets its own version of the counter.

## load testing with locust

### why load testing matters

Most bugs don’t show up during manual tests. Code looks clean. But when traffic spikes, timing breaks things. Load testing reveals what unit tests can’t.

This is how a stale cache may happen:

![Stale Caching]

> ⚠️ Even with HybridCache and Redis, fast write-read cycles can cause stale reads. This test is designed to expose that lag.

### why we use locust

[Locust] is a Python-based, event-driven load testing tool. It gives us:

- async I/O for high scale
- custom user behavior
- live UI with stats and failures
- active community

### project structure

We organize tests like this:

```
📂 tests/python/load-tests/
 ├── common/
 │   ├── api.py                 # API client helpers
 │   ├── config.py              # base URL config
 ├── locustfiles/
 │   ├── stale_cache.py         # basic stale cache test
 │   ├── stale_cache_wave.py    # wave simulation
 ├── locust.conf                # locust settings
```

## running the test: setup

We use `uv` for speed. Here’s the setup:

```bash
cd tests/python/load-tests
uv venv
uv pip install -r requirements.txt
```

> The `requirements.txt` pins the Locust version.

### locust config: `locust.conf`

```ini
host = http://localhost:5000
users = 90
spawn-rate = 5
run-time = 30s
```

- 90 users
- 5 new users per second
- 30 seconds test duration

## lifecycle: setup and cleanup

Each test run sets up fresh data and deletes it afterward. Here’s how:

```python
import requests
import common.config as config

from locust import events
from locust.runners import WorkerRunner
from common.api import Api

api = Api(requests, f"{config.API_URL}")

@events.test_start.add_listener
def on_test_start(environment, **kwargs):
    if isinstance(environment.runner, WorkerRunner):
        return

    payload = {
        "title": "StaleCache Book 1",
        "author": "StaleCacheUser",
        "isbn": "1234567890123",
    }
    try:
        api.add_book(payload)
    except Exception as e:
        print(f"[SETUP] Failed to add book: {e}")

@events.test_stop.add_listener
def on_test_stop(environment, **kwargs):
    if isinstance(environment.runner, WorkerRunner):
        return

    try:
        books = api.get_all_books()
        for book in books:
            api.delete_book(book.get("id"))
    except Exception as e:
        print(f"[CLEANUP] Failed to delete books: {e}")
```

- `test_start` adds a test record
- `test_stop` deletes all
- Guards skip this logic for distributed workers

## detecting stale reads: core test logic

Here’s the main test in `stale_cache.py`:

```python
import time
import threading
import events_handler

from locust import FastHttpUser, task, between
from common.api import Api

global_counter = 0
counter_lock = threading.Lock()

class StaleCacheUser(FastHttpUser):
    wait_time = between(0.01, 0.02)

    def on_start(self):
        self.api = Api(self.client, "/books")
        self.books = self.api.get_all_books()

    @task
    def stale_cache(self):
        if not self.books:
            return

        book_id = self.books[0]["id"]
        user_id = self.environment.runner.user_count

        global global_counter
        with counter_lock:
            global_counter += 1
            my_counter = global_counter

        title = f"user:{user_id}-title-{my_counter}"
        payload = {"title": title, "author": "StaleCache", "isbn": "1234567890123"}
        self.api.update_book(book_id, payload)
        time.sleep(0.05)

        data = self.api.get_book(book_id)
        fetched_title = data.get("title", "")
        fetched_counter = int(fetched_title.split("-")[-1])

        if fetched_counter < my_counter:
            self.environment.runner.stats.log_error(
                "GET",
                f"/books/{book_id}",
                f"⚠️ Stale cache detected! Wrote '{title}', but read '{fetched_title}'",
            )
```

- Counter ensures we track each write
- Lock avoids race conditions across threads
- Reads are validated immediately after writes

### running the test

```bash
locust -f locustfiles/stale_cache.py
```

Open your browser at [http://localhost:8089](http://localhost:8089) to monitor in real time.

Check the **Failures tab**. Each failure means a stale read: the written title had a higher counter than the read.

![Locust stale cache load test]

## wave simulation: more realistic traffic

Users don’t come all at once. They arrive in bursts - morning rush, lunch spike, evening surge.

We simulate this using `LoadTestShape`:

```python
from stale_cache import StaleCacheUser
from locust import LoadTestShape


class WaveShape(LoadTestShape):
    wave_users = [3, 30, 3, 60, 3, 90, 3]  # Users per wave
    wave_duration = 20  # seconds per wave

    def tick(self):
        run_time = self.get_run_time()
        wave = int(run_time // self.wave_duration)
        if wave < len(self.wave_users):
            users = self.wave_users[wave]
            print(f"[WaveShape] At {run_time:.1f}s: wave {wave}, users={users}")
            return (users, users)  # (user_count, spawn_rate)
        print(f"[WaveShape] Test finished at {run_time:.1f}s")
        return None

```

### run it

```bash
locust -f locustfiles/stale_cache_wave.py
```

Watch the wave pattern in the **Failures tab** - spikes followed by calm.

![Locust stale cache wave load test]

## why the cache falls behind: a look at the PUT handler

Here’s the ASP.NET endpoint we’re stressing with updates:

```csharp
app.MapPut("/books/{id}",
    async (
        int id,
        AddBookRequest request,
        BooksInventoryDbContext db,
        HybridCache cache) =>
{
    var book = await db.Books.AsNoTracking().FirstOrDefaultAsync(b => b.Id == id);
    if (book is null)
    {
        return Results.NotFound(new { Message = "Book not found", BookId = id });
    }

    // Step 1: Update the record
    book = book with
    {
        Title = request.Title,
        Author = request.Author,
        ISBN = request.ISBN
    };

    // Step 2: Save it to the database
    db.Books.Update(book);
    await db.SaveChangesAsync();
    // ✅ DB is now up-to-date

    // ⚠️ Race condition window:
    // a GET might hit here before
    // the cache is updated

    // Step 3: refresh the cache
    await cache.SetAsync($"book_{id}", book);
    // 🕒 Cache is eventually updated

    return Results.Ok(book);
});
```

Looks fine at first:

- Step 1: we update the record
- Step 2: save it to the database
- Step 3: refresh the cache

But here’s the catch:

```txt
[PUT Request]
   |
   |--> SaveChangesAsync() ✅
   |        |
   |   [Concurrent GET hits here ❌]
   |
   |--> SetAsync() ✅
```

That GET reads stale data.

It’s not a bug. It’s just timing.

And that’s exactly what our test catches:

```
Update → cache delay → stale read
```

## should we fix stale caches?

### maybe not.

Some systems **need** consistency. For others, eventual is good enough.

- Fix it if: your app needs real-time accuracy (banking, auctions, dashboards).
- Leave it if: your app can survive a short delay (feeds, comments, inventory views).

Choose based on what breaks when data is stale.

## what we learned

- 🧠 stale reads happen under pressure
- 🔍 locust helps surface silent failures
- 🌊 real users behave in waves
- ⚖️ consistency isn’t free - know when to pay

**source code**: [GitHub repository]

[Architecture Load Testing]: ../../.assets/books-inventory/architecture-load-testing.svg
[Locust]: https://locust.io
[Stale Caching]: ../../.assets/books-inventory/stale-caching.svg
[Locust stale cache load test]: ../../.assets/books-inventory/stale-cache-load-test.gif
[Locust stale cache load test failures]: ../../.assets/books-inventory/stale-cache-load-test-failures.png
[Locust stale cache wave load test]: ../../.assets/books-inventory/stale-cache-wave-load-test.gif
[GitHub repository]: https://github.com/dorinandreidragan/books-inventory/tree/episode/05-hidden-cost-of-caching
