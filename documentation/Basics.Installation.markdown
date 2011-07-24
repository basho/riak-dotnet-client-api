---
layout: default
title: Getting Started
heading: Getting and Installing <strong>CorrugatedIron</strong>
subheading: How to get the library and include it in your project
menuitem: Documentation
---

You're a .NET developer. You want to get started with Riak (or you're at least curious about it), you've heard about [CorrugatedIron][ci] and are keen to give it a spin. This article will show you how you can easily include CorrugatedIron in your project in preparation for communicating with your Riak Cluster.

## Dependencies ##

CorrugatedIron uses two other librarires behind the scenes:

* [protobuf-net][] by Marc Gravell ([license](http://code.google.com/p/protobuf-net/source/browse/trunk/Licence.txt))
* [Json.NET][] by James Newton-King ([license](http://json.codeplex.com/license))

These libraries will be included, in one way or another, with the CorrugatedIron distribution.

## Getting via Nuget ##

The easiest way to install libarires in your project is to use [Nuget][]. CorrugatedIron has a [Nuget package][ci_nuget] package available which can be installed directly into your project by simply opening up the Package Manager Console and typing:

    PM> Install-Package CorrugatedIron

You can also use the Nuget GUI to search for and install the package.

You will notice that using this method of installation results in both protobuf-net and Json.NET being installed via Nuget as well, and each of the libraries has been added as a reference to your project. This method also makes modifications to either the `web.config` or `app.config` for you so that the bulk of the configuration work is already done.

Very handy!

If you don't have either an `app.config` or a `web.config` in your project (for example, if you were using [Manos][]) then you can create a custom configuration file and use this file instead. All you need to do is make sure that CorrugatedIron knows which file to use when you're loading the configuration. There is an API overload available for when you need to do this.

## Getting via Github Download ##

All of the binary releases, along with the dependencies, are available directly from the [Github download page][ci_download]. Download the most recent version of CorrugatedIron and extract the entire contents of the archive to a folder which is accessible to your solution. At this point, open up your development environment (be it Visual Studio or MonoDevelop) and each assembly from the archive to your project as a reference.

## Building from Source ##

If you're doing this, you're a developer who probably doesn't need much hand-holding, so we'll keep this bit brief. Get yourself a [git][] client and type:

    git clone git://github.com/DistributedNonsense/CorrugatedIron.git
    git checkout master

This will pull down the source and update your working folder to the latest stable release version. Fire up your IDE (either Visual Studio or MonoDevelop), build, and you're ready to rock.

## Summing it up ##

Getting hold of CorrugatedIron and including it in your project is really simple. Next, you'll need to [configure it][ci_config]!


[ci]: http://github.com/DistributedNonsense/CorrugatedIron "CorrugatedIron at Github"
[ci_configure]: /path/to/the/configuration/page.html
[ci_download]: http://github.com/DistributedNonsense/CorrugatedIron/downloads "CorrugatedIron downloads at Github"
[ci_nuget]: http://nuget.org/List/Packages/CorrugatedIron "CorrugatedIron Package at Nuget"
[Nuget]: http://nuget.org/ "Nuget"
[Json.NET]: http://json.codeplex.com "Json.NET"
[protobuf-net]: http://code.google.com/p/protobuf-net/ "protobuf-net"
[Manos]: https://github.com/jacksonh/manos/ "Manos"
