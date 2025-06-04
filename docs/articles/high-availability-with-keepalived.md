---
title: "ensuring high availability with two-server setup using keepalived"
date: 2025-01-23
category:
  - devops
order: 1
tag:
  - linux
  - devops
summary: "Achieve high availability with a two-server setup using Keepalived and Vagrant."
---

<ArticleStatusBadge />

# 🔋⚡ ensuring high availability with two-server setup using Keepalived

Ensuring high availability with limited resources can be challenging. I recently wanted to prove you can do it using [Keepalived] and just two servers 💪✨. To prove it, I used [Vagrant]. Here's a quick rundown of my journey! 🚀

## step 1: Creating the Vagrantfile

First, I created a Vagrantfile to define my virtual machines. This file specified the configuration for two Ubuntu 22.04 VMs, each with a unique MAC address and a static IP address in the same subnet.

```ruby
Vagrant.configure("2") do |config|
  # Array of predefined MAC addresses
  mac_addresses = ["080027000001", "080027000002"]

  # Array of static IP addresses for the VMs
  ip_addresses = ["192.168.56.11", "192.168.56.12"]

  mac_addresses.each_with_index do |mac, index|
    config.vm.define "vm#{index + 1}" do |vm|
      vm.vm.box = "ubuntu/jammy64"
      vm.vm.network "private_network", ip: ip_addresses[index], mac: mac
      vm.vm.provider "virtualbox" do |vb|
        vb.name = "vm#{index + 1}"
        vb.memory = "512"
        vb.cpus = 1
      end

      # Provision Keepalived and Nginx
      vm.vm.provision "shell", inline: <<-SHELL
        sudo apt-get update
        sudo apt-get install -y keepalived nginx
        # Example Keepalived configuration
        sudo bash -c 'cat > /etc/keepalived/keepalived.conf <<EOF
vrrp_instance VI_1 {
    state #{index == 0 ? 'MASTER' : 'BACKUP'}
    interface enp0s8
    virtual_router_id 51
    priority #{index == 0 ? 100 : 90}
    advert_int 1
    authentication {
        auth_type PASS
        auth_pass 1234
    }
    virtual_ipaddress {
        192.168.56.10
    }
}
EOF'
        sudo systemctl restart keepalived

        # Configure a simple web page to show role (MASTER or BACKUP)
        sudo bash -c 'echo "<html><body><h1>Server Role: #{index == 0 ? 'MASTER' : 'BACKUP'}</h1></body></html>" > /var/www/html/index.html'
        sudo systemctl restart nginx
      SHELL
    end
  end
end
```

## Step 2: Spinning Up the VMs

With the Vagrantfile ready, I used Vagrant commands to create and start the virtual machines.

```bash
vagrant up
```

This command created and configured the VMs as specified in the Vagrantfile. Once the VMs were up and running, I could SSH into them to verify the setup.

```bash
vagrant ssh vm1
vagrant ssh vm2
```

## Step 3: Configuring Keepalived

The heart of this setup was the Keepalived configuration. The Vagrantfile already included provisioning scripts to install and configure Keepalived on both VMs. Here’s a recap of the configuration:

- **On the MASTER server:**

```plaintext
vrrp_instance VI_1 {
    state MASTER
    interface enp0s8
    virtual_router_id 51
    priority 100
    advert_int 1
    authentication {
        auth_type PASS
        auth_pass 1234
    }
    virtual_ipaddress {
        192.168.56.10
    }
}
```

- **On the BACKUP server:**

```plaintext
vrrp_instance VI_1 {
    state BACKUP
    interface enp0s8
    virtual_router_id 51
    priority 90
    advert_int 1
    authentication {
        auth_type PASS
        auth_pass 1234
    }
    virtual_ipaddress {
        192.168.56.10
    }
}
```

## Step 4: Testing the Setup

With everything configured, it was time to test the setup. I started by verifying that the virtual IP (VIP) was correctly assigned to the `MASTER` server.

```bash
ip a show enp0s8
```

I then accessed the web server using the VIP to ensure it was reachable.

```bash
curl http://192.168.56.10
```

If the setup is correct, you should see the page that indicates which server (MASTER or BACKUP) is responding.

## Step 5: Simulating Failover

To test the failover functionality, I stopped the Keepalived service on the `MASTER` server.

```bash
sudo systemctl stop keepalived
```

I then checked the `BACKUP` server to see if it had taken over the VIP.

```bash
ip a show enp0s8
```

Sure enough, the `BACKUP` server had taken over, and the web server was still accessible via the VIP.

## Lessons Learned

This experience proved that high availability can be achieved with just two servers using Keepalived. Here are some key takeaways:

1. **Simplicity and Power**: Keepalived is a powerful tool that is relatively simple to set up and configure.
2. **High Availability on a Budget**: Even with just two servers, you can achieve a high level of availability.
3. **Practical Testing**: Always test your setup thoroughly to ensure that failover works as expected.

## Conclusion

When it comes to ensuring high availability with limited resources, Keepalived is a great tool to have in your arsenal. I hope this article has inspired you to explore high availability setups further.

Feel free to share your own experiences or ask questions in the comments below. Use your resources wisely and keep your systems running smoothly! 🛠️💡💻⚙️

[Keepalived]: https://keepalived-v2.readthedocs.io/en/latest/
[Nginx]: https://nginx.org/
[Vagrant]: https://www.vagrantup.com/
[VirtualBox]: https://www.virtualbox.org/
