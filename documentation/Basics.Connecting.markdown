---
layout: default
title: Getting Started
heading: Connecting to Riak with <strong>CorrugatedIron</strong>
subheading: How to get the library functioning inside your application
menuitem: Documentation
---

You're a .NET developer. You want to get started with Riak (or you're at least curious about it). We have the same questions. Here's how to get started with Riak and [CorrugatedIron][ci].

## Getting Connected to Riak ##

Getting connected to Riak is pretty straightforward. There are three steps to get started and, luckily, you may not need to do all of them.

1. Verify that Riak is listening.
2. Create your configuration file.
3. Connect!

### Verifying that Riak is Listening ###

First you need to know which port number Riak is running on.

* If Riak was installed via a package (such as a Debian `.deb` package or Homebrew) or from source and built using `make rel` then by default the port number that Riak listens on is `8098`.
* If Riak was installed from source and built using `make devrel` then this means that there is a 3-node cluster ready and listening on ports `8091`, `8092` and `8093`.

Fire up a browser and point it to your Riak machine with a URL like `http://riak-test:8098/riak/status`. You can connect to any node in your Riak cluster (you could even have it behind some kind of load balancing proxy). I have three nodes in my development cluster and `riak-test` is an alias for the localhost (I do .NET development in a Windows 7 VM but run Riak in OS X). Verify the port number with your admin if you can't get connected. If the port number is right, and you can't connect then we need to move on to verifying if Riak is listening. If you get connected at this point, then move on to the next step.

If you can't get connected, the best bet is to make sure Riak is listening on the right IP and port. Open up the `app.config` file and look in the `riak_core` and `riak_kv` sections. Make sure the `http`, `https`, and/or `pb_ip`/`pb_port` configuration values list the IP and port combinations that you're expecting. If you're a developer with a development cluster running on a different machine to the one you intend to connect from using CorrugatedIron then it is important that IP addresses for `pb_ip`, `http` and `https` (if used) are not set to `127.0.0.1` as this is the loopback address. Binding to this address will prevent any connections from applications not on the local machine from connecting to Riak. If in doubt, the easiest way to solve the IP binding problem is to change all instances of `127.0.0.1` to `0.0.0.0`, which will tell Riak to bind to all interfaces on the machine.

CorrugatedIron makes use of both the HTTP and PBC interfaces, so it is important that both of these are configured correctly. Where possible, CorrugatedIron uses the Protocol Buffers API instead of the HTTP API to improve application throughput and performance, but it will degrade to the HTTP API in cases where the required feature set is not available via the Protocol Buffers interface.

When all else fails, [check the wiki][wiki_install].

### Configuring .NET and CorrugatedIron to Talk to Riak ###

Now that you can (hopefully) talk to Riak, the next step is to set up the configuration that will let CorrugatedIron talk to Riak. This can be done manually or automatically depending on your environment.

#### Manual Installation and Configuration ####

In your `web.config` or `app.config` create a configuration section for Riak:

    <configSections>
      <section name="riakConfig" type="CorrugatedIron.Config.RiakClusterConfiguration, CorrugatedIron"/>
    </configSections>

There are some niceties built into [CorrugatedIron][ci] to make it very easy to import your Riak settings and create a RiakClient object using an IoC container. More on that in a minute...

You've told your application to expect a configuration section, now actually add the configuration section:

    <riakConfig>
        <nodes>
            <node name="dev1" hostAddress="riak-test" pbcPort="8081" restPort="8091" poolSize="20" />
            <node name="dev2" hostAddress="riak-test" pbcPort="8082" restPort="8092" poolSize="20" />
            <node name="dev3" hostAddress="riak-test" pbcPort="8083" restPort="8093" poolSize="20" />
        </nodes>
    </riakConfig>

Here you're creating a 3 node cluster listening on the `riak-test` machine, which is really just a simple cluster like you would create if you walked through the [Riak Fast Track][wiki_ft]. You could just as easily configure a single node, five node, or 60 node cluster. CorrugatedIron supplies a basic load balancer using round robin.

### Connecting CorrugatedIron to Riak ###

At this point, you should have Riak configured to accept connections and the CorrugatedIron configuration should be set up and ready to go. The next step is to wire up CorrugatedIron. We made this pretty easy to do using whatever mechanism you'd like. This example shows how you would connect to Riak using plain old .NET. 

    var clusterConfig = RiakClusterConfiguration.LoadFromConfig("riakConfig");
    var cluster = new RiakCluster(clusterConfig, new RiakConnectionFactory());
    var client = cluster.CreateClient();

After you've connected, you can issue a `Client.Ping()` to make sure you're able to communicate with Riak. `Client.Ping()` returns a [`RiakResult`][riakresult] object. If the `Ping()` is successful `RiakResult.IsSuccess` will be true. At this point, you should get a valid response from Riak. If not, take a look through your configuration, run through the [Riak fast track][wiki_ft], and hit up either the Riak developer mailing list or else the #riak IRC channel on freenode.

### Connecting CorrugatedIron to Riak - Using Unity ###

If you don't want to do things the old fashioned way, you can always use an IoC library to get connected to Riak through CorrugatedIron. Almost all of the [CorrugatedIron sample projects][ci_samples] make use of the Unity IoC library to handle automatically configuring communication with Riak. Just to take care of your curiosity, here's what this might look like. You'll need a Unity bootstrapper:

    using CorrugatedIron;
    using CorrugatedIron.Comms;
    using CorrugatedIron.Config;
    using Microsoft.Practices.Unity;

    namespace Sample.Unity
    {
        public static class UnityBootstrapper
        {
            public static IUnityContainer Bootstrap()
            {
                var clusterConfig = RiakClusterConfiguration.LoadFromConfig("riakConfig");

                var container = new UnityContainer();
                container.RegisterInstance<IRiakClusterConfiguration>(clusterConfig);

                container.RegisterType<IRiakConnectionFactory, RiakConnectionFactory>(new ContainerControlledLifetimeManager());
                container.RegisterType<IRiakCluster, RiakCluster>(new ContainerControlledLifetimeManager());

                // tell unity to use the IRiakCluster.CreateClient() function to generate new client instances
                container.RegisterType<IRiakClient>(new InjectionFactory(c => c.Resolve<IRiakCluster>().CreateClient()));

                return container;
            }
        }
    }

Inside the class that's instantiating the Riak connection, it's just as simple as:

    var container = UnityBootstrapper.Bootstrap();
    var client = container.Resolve<IRiakClient>();

You can find more examples of configuring CorrugatedIron in the [`CorrugatedIron.Samples`][ci_samples] project hosted on github.

### But I'm not using a standard configuration! ###

There are cases where a `web.config` or `app.config` files don't exist. This is fine! Just put your configuration in your own config file (eg. `corrugatediron.config`) and use the appropriate overload to load the configuration from that file:

    var clusterConfig = RiakClusterConfiguration.LoadFromConfig("riakConfig", @"path\to\ci.config");

Voila!

## Summing It Up ##

Connecting to Riak, especially with CorrugatedIron, should be quick and painless. Riak can be configured in many ways, hidden behind reverse proxies, or exposed to the world. We try to handle all of these scenarios through CorrugatedIron.

[ci]: http://github.com/DistributedNonsense/CorrugatedIron "CorrugatedIron at Github"
[ci_samples]: http://github.com/DistributedNonsense/CorrugatedIron.Samples "CorrugatedIron sample applications at Github"
[wiki_install]: http://wiki.basho.com/Installation-and-Setup.html "Riak installation and setup"
[wiki_ft]: http://wiki.basho.com/The-Riak-Fast-Track.html "Riak fast track"
[unityplex]: http://unity.codeplex.com/ "Unity IoC Container"
[riakresult]: https://github.com/DistributedNonsense/CorrugatedIron/blob/master/CorrugatedIron/RiakResult.cs "RiakResult object"

