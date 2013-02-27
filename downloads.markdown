---
layout: default
title: CorrugatedIron Downloads
heading: Down<strong>loads</strong>
subheading: Get you some code!
menuitem: Downloads
---

Current Version
---------------

CorrugatedIron is still in very active development. We have just proudly released [v1.2.1][released_source]. If you're keen to get your hands on it you have the following options:

* Grab the source directly from our Github repository ([development][] | [stable][released_source]).
* Download the source as an archive ([tar][] | [zip][]).
* Install the CorrugatedIron [Nuget package][nuget] directly into your project via Nuget.

If you're a user of Visual Studio the easiest option is to install the Nuget package. This can be done via the Nuget Package Management GUI, or from the Package Manager Console:

    PM> Install-Package Corrugatediron

Sample Applications
-------------------

If you're anything like us, you'll appreciate a few sample applications to base your code off even if the [documentation][] is really good. For that reason we've provided a few sample applications to get you started.

The sample applications can be found in our [samples repository][samples]. The samples include:

* A [Session State Provider][session_state] provider which uses CorrugatedIron to store ASP.NET session state in Riak.
* A .NET client for [Sean Cribbs][]' chat application, [YakRiak][].
* A generic sample application which shows many of CorrugatedIron's features and demonstrates how to configure and wire-up CorrugatedIron using:
    * [Autofac][]
    * [Ninject][]
    * [StructureMap][]
    * [TinyIoC][]
    * [Unity][]

  [Autofac]: http://code.google.com/p/autofac/ "Autofac IoC"
  [Ninject]: http://ninject.org/ "Ninject IoC"
  [Sean Cribbs]: http://twitter.com/seancribbs "Sean Cribbs @ Twitter"
  [StructureMap]: http://structuremap.net/structuremap/ "StructureMap IoC"
  [TinyIoC]: https://github.com/grumpydev/TinyIoC "TinyIoC"
  [Unity]: http://unity.codeplex.com/ "Unity IoC"
  [YakRiak]: https://github.com/seancribbs/yakriak "YakRiak - a Riak-based Chat application"
  [development]: https://github.com/DistributedNonsense/CorrugatedIron/tree/develop "Development branch"
  [documentation]: http://corrugatediron.org/documentation/Basics.Installation.html
  [nuget]: http://www.nuget.org/List/Packages/CorrugatedIron "Nuget Package"
  [released_source]: https://github.com/DistributedNonsense/CorrugatedIron/tree/v1.2.1 "v1.2.1 source"
  [samples]: https://github.com/DistributedNonsense/CorrugatedIron.Samples "Samples"
  [session_state]: http://msdn.microsoft.com/en-us/library/aa478952.aspx "Session State Providers"
  [tar]: https://github.com/DistributedNonsense/CorrugatedIron/tarball/v1.2.1 "v1.2.1 source tarball"
  [zip]: https://github.com/DistributedNonsense/CorrugatedIron/zipball/v1.2.1 "v1.2.1 source zip"

