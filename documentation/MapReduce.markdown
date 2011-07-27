---
layout: default
title: Map/Reduce Queries
heading: Map/Reduce <strong>Queries</strong>
subheading: An introduction to Map/Reduce queries
menuitem: Documentation
---

Given the design philosophy behind Key/Value stores, querying the store via a mechanism other than the item's I.D. isn't the easiest of tasks. [Map/Reduce][MR] is one of the features of Riak which allows for various operations on data, including querying, filtering and aggregating information.

Full documentation of the Map/Reduce features available in Riak can be found on the [Riak Map/Reduce wiki page][MRWiki]. This article covers how to use these features in CorrugatedIron, but doesn't cover the features themeselves.

## Preparing the job ##

CorrugatedIron provides a single class which is the first point of call when you're looking to do a Map/Reduce query. That class is (surprisingly) called [`RiakMapReduceQuery`][RiakMapReduceQuery.cs] and has a [fluent][]-style interface which (hopefully) makes it easy to work with.

Creating an instance is, as expected, as simple as:

{% highlight csharp %}
var query = new RiakMapReduceQuery();
{% endhighlight %}

After creating an instance, the first thing you'll want to do is specify the [inputs][MRInputs] for the Map/Reduce job. Inputs can be specified in three different ways...

### Job Inputs ###

* *Bucket Name* - A single string value that indicates the job should operate on all the keys within that bucket.
* *Bucket/Key Pairs* - A list of [RiakBucketKeyInput][RiakBucketKeyInput.cs] instances which represent the Bucket/Key pairs which the job should operate on.
* *Bucket/Key/Arg Trio* - A list of [RiakBucketKeyArgInput][RiakBucketKeyArgInput.cs] instances which represent the Bucket/Key pairs, along with a per-item argument, which the job should operate on.

Here is how you would specify a single bucket input:

{% highlight csharp %}
var query = new RiakMapReduceQuery()
                .Inputs("BucketName");
{% endhighlight %}

To specify Bucket/Key pairs, do the following:

{% highlight csharp %}
var items = new []
            {
                new RiakBucketKeyInput("bucket1", "key1"),
                new RiakBucketKeyInput("bucket1", "key2"),
                new RiakBucketKeyInput("bucket2", "key3")
            };
var query = new RiakMapReduceQuery()
                .Inputs(items);
{% endhighlight %}

To specify Bucket/Key/Arg trios, do the following:

{% highlight csharp %}
var items = new []
            {
                new RiakBucketKeyArgInput("bucket1", "key1", 42),
                new RiakBucketKeyArgInput("bucket1", "key2", 3.1415),
                new RiakBucketKeyArgInput("bucket2", "key3", "slartibartfast")
            };
var query = new RiakMapReduceQuery()
                .Inputs(items);
{% endhighlight %}

Now that the inputs have been specified, you next need to choose the phases you wish to run.

### Phase types and languages ###

Riak has different types of [phases][MRPhases] which can be run during the course of a single Map/Reduce job, and each type of phase can be specified more than once if required. Each of those phase types is matched with one or more methods on the `RiakMapReduceQuery` class. Each one of these methods takes a single parameter, which is an `Action<T>`. The type `T` for that action will vary depending on the phase and the language that the phase is executed with. The instance of `T` that is passed has all the methods and properties which are available for that phase type and language type. The action that is passed in as a paramter should operate on the instance of `T` to configure that phase.

The phase methods are...

#### MapJs() ####

This indicates that the phase is a **Map** phase which uses Javascript as the language. The action parameter for this function call is of type [`RiakFluentActionPhaseJavascript`][RiakFluentActionPhaseJavascript.cs] and can also be configured in a fluent style. This class can contains the following methods:

* `Keep(bool)` - tells CorrugatedIron that the results of this phase should be kept or discarded.
* `Argument<T>(T)` - specifies the argument to pass in to the phase for each bucket/key pair that is processed during the phase.
* `Name(string)` - specifies the name of a built-in Javascript Map function to use for this phase (such as `"Riak.mapValuesJson"`).
* `Source(string)` - specifies the full source, in Javascript, of the function to execute for this phase.
* `BucketKey(string, string)` - specifies the Bucket name and Key name which indicates the location, inside Riak, of the object which contains the Javascript source function to use during this phase.

`Name()`, `Source()` and `BucketKey()` are all mutually exclusive. Only one of these values should be set. If more than one of these is set then an exception will occur when the Map/Reduce query is executed.

Both the `Keep()` and `Argument()` functions are safe and can be set at any time along with any of the other functions.

Here are a few examples:

{% highlight csharp %}
var query1 = new RiakMapReduceQuery()
                 .Inputs("BucketName")
                 .MapJs(m => m.Name("Riak.mapValuesJson").Keep(true));

var query2 = new RiakMapReduceQuery()
                 .Inputs("SomeBucket")
                 .MapJs(m => m.BucketKey("mapred_scripts", "do_magic").Argument("foo"));

var query3 = new RiakMapReduceQuery()
                 .Inputs(new []{new RiakBucketKeyArgInput("bucket1", "key1", 42)})
                 .MapJs(m => m.Source("function(v,d,a){return [d == v ? 1 : 0];}"));
{% endhighlight %}

Note: The order that the phase functions are executed on the `RiakMapReduceQuery` class indicate the order in which those phases will be executed.

[MRInputs]: http://wiki.basho.com/MapReduce.html#Inputs "Riak Map/Reduce Inputs"
[MRPhases]: http://wiki.basho.com/MapReduce.html#Phase-functions "Riak Map/Reduce Phase Functions"
[MRWiki]: http://wiki.basho.com/MapReduce.html "Riak Map/Reduce"
[MR]: http://en.wikipedia.org/wiki/MapReduce "Map/Reduce definition"
[RiakBucketKeyArgInput.cs]: https://github.com/DistributedNonsense/CorrugatedIron/blob/master/CorrugatedIron/Models/MapReduce/Inputs/RiakBucketKeyArgInput.cs "RiakBucketKeyArgInput class"
[RiakBucketKeyInput.cs]: https://github.com/DistributedNonsense/CorrugatedIron/blob/master/CorrugatedIron/Models/MapReduce/Inputs/RiakBucketKeyInput.cs "RiakBucketKeyInput class"
[RiakFluentActionPhaseJavascript.cs]: https://github.com/DistributedNonsense/CorrugatedIron/blob/master/CorrugatedIron/Models/MapReduce/Fluent/RiakFluentActionPhaseJavascript.cs "RiakFluentActionPhaseJavascript class"
[RiakMapReduceQuery.cs]: https://github.com/DistributedNonsense/CorrugatedIron/blob/master/CorrugatedIron/Models/MapReduce/RiakMapReduceQuery.cs "RiakMapReduceQuery class"
[fluent]: http://en.wikipedia.org/wiki/Fluent_interface "Fluent Interface"
