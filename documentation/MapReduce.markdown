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

This indicates that the phase is a **Map** phase which uses Javascript as the language. The action parameter for this function call is of type [`RiakFluentActionPhaseJavascript`][RiakFluentActionPhaseJavascript.cs] and can also be configured in a fluent style. This class contains the following methods:

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

#### MapErlang() ####

Just like `MapJs()`, `MapErlang()` indicates that this is a **Map** phase, but uses _Erlang_ instead of Javascript as the source language. The big difference with `MapErlang()` is that you can't write Erlang source code and pass that in as a paramter like you can with `MapJs()`.

The action parameter for this function call is of type [`RiakFluentActionPhaseErlang`][RiakFluentActionPhaseErlang.cs] and can be configured in a fluent style. This class contains the following methods:

* `Keep(bool)` - tells CorrugatedIron that the results of this phase should be kept or discarded.
* `Argument<T>(T)` - specifies the argument to pass in to the phase for each bucket/key pair that is processed during the phase.
* `ModFun(string, string)` - Erlang functions are located inside a module. This function indicate which function to execute and the module that it can be found in.

Here's an example:

{% highlight csharp %}
var query = new RiakMapReduceQuery()
                .Inputs("BucketName")
                .MapErlang(m => m.ModFun("my_module", "the_function").Keep(true));
{% endhighlight %}

#### ReduceJs() and ReduceErlang() ####

Both `ReduceJs()` and `ReduceErlang()` have interfaces that match their **Map** counterparts, hence the functions that can be invoked are also the same.

Here's an example:

{% highlight csharp %}
var query = new RiakMapReduceQuery()
                .Inputs("BucketName")
                .MapJs(m => m.Source(@"function(o){return[1];}"))
                .ReduceJs(m => m.Name(@"Riak.reduceSum").Keep(true));
{% endhighlight %}

#### Link() ####

`Link()` provides the ability to get access to linked items via Riak's [link][RiakLinks] capability. This method expects an action which takes a [`RiakFluentLinkPhase`][RiakFluentLinkPhase.cs]. This class has the following methods:

* `Keep(bool)` - tells CorrugatedIron that the results of this phase should be kept or discarded.
* `Bucket(string)` - specifies the name of the bucket to look for links in.
* `Tag(string)` - specifies the name of the tag which the link must have.
* `AllLinks()` - indicates that the user is interested in _all_ of the links that the object has.
* `FromRiakLink(RiakLink)` - helper function which translates a [RiakLink][] instance into a link search definition.

Here are a few examples;

{% highlight csharp %}
// get all friends in the "people" bucket (avoids pets and programmers)
var query1 = new RiakMapReduceQuery()
                 .Inputs("people")
                 .Link(l => l.Tag("friend").Bucket("people"))
                 .ReduceErlang(r => r.ModFun("riak_kv_mapreduce", "reduce_set_union").Keep(true));

// get every link available for each person
var query2 = new RiakMapReduceQuery()
                 .Inputs("people")
                 .Link(l => l.AllLinks())
                 .ReduceErlang(r => r.ModFun("riak_kv_mapreduce", "reduce_set_union").Keep(true));

// get every language OJ doesn't like
var query3 = new RiakMapReduceQuery()
                 .Inputs(new []{new RiakBucketKeyInput("people", "oj")})
                 .Link(l => l.Tag("dislike").Bucket("languages"))
                 .ReduceErlang(r => r.ModFun("riak_kv_mapreduce", "reduce_set_union").Keep(true));
{% endhighlight %}

The result set of the last query <del>would</del>may include PHP.

#### Filter() ####

When dealing with items during a Map/Reduce job, Riak provides the ability to filter out instances which don't match a set of predicates using [key filters][RiakKeyFilters].

`Filter()` functions differently to how the other phases work due to the potential complexity of the filter. The function takes an instance of a Key Filter, of arbitrary complexity, and adds that to the set of key filters which will eventually be included in the query.

Here's an example:

{% highlight csharp %}
var query = new RiakMapReduceQuery()
                .Inputs("people")
                .Filter(new Matches("jeremiah"))
                .Link(l => l.Tag("friends").Bucket("people"))
                .ReduceErlang(r => r.ModFun("riak_kv_mapreduce", "reduce_set_union").Keep(true));
{% endhighlight %}

For more in-depth information about Key Filters and the types that are available through this interface, take a look at our [Key Filter documentation][KeyFilterDocs] page.

**Note:** Key filters were made available in v0.14. Do not use the key filter functionality if your Riak cluster has an earlier version.

### Important Note ###

The order that the phase functions are executed on the `RiakMapReduceQuery` class indicate the order in which those phases will be executed inside Riak. Make sure you get them right!

## Executing the job ##

Thankfully the task of executing the job is incredibly simple compared to setting one up! All you need to do is pass the query instance into one of the [RiakClient][] Map/Reduce interface functions. The options are:

* `RiakClient.MapReduce()` - This is the blocking, non-streaming version of the interface. If you know that your query isn't going to take long, and that you're interested in dealing with the results on the current thread then this is the function for you. Bear in mind that all of the results are fetched before the function returns.
* `RiakClient.StreamMapReduce()` - Use this when you know that you're going to be dealing with a large result set (probably the most common use case). The result set will be pulled out of Riak as you're processing the results, which means the memory required to parse the result set is substantially smaller than a straight `MapReduce()` call.
* `RiakClient.Async.MapReduce()` - This is the asynchronous counterpart to `Riak.MapReduce()`, it functions exactly the same way, the only difference is that the result set is returned to the specified callback on the a different thread.
* `RiakClient.Async.StreamMapReduce()` - This is the asynchronous counterpart to `Riak.StreamMapReduce()`, it functions exactly the same way, the only difference is that the result set is returned to the specified callback on the a different thread.

Here are some examples:

{% highlight csharp %}
var client = cluster.GetClient();
.
.
var query = new RiakMapReduceQuery()/* setup your query */;

// blocking, non-streaming
var result = client.MapReduce(query);

// blocking, streaming
var streamedResult = client.StreamMapReduce(query);

// async, non-streaming
client.Async.MapReduce(query, resultHandler);

// async, streaming
client.Async.StreamMapReduce(query, streamedResultHandler);
{% endhighlight %}

## Handling the Results ##

Regardless of the approach that you take when executing the query, you'll get an object back which contains the results of the phases that were executed by the Map/Reduce job. If you chose to use a non-streaming API call, the result you get back will include the phase results **in the order that they were specified**.

If you decided to use one of the streaming APIs, we aren't able to guarantee that the results will be in the order in which the phases were specified, hence is it up to the caller to make sure they are dealing with the right result phase when parsing the results.

Parsing the results is simple as enumerating them and extracting values:

{% highlight csharp %}
var result = client.MapReduce(query);

if(result.IsSuccess)
{
    foreach(var phase in result.Value.PhaseResults)
    {
        // this contains the phase index
        var phaseNume = phase.Phase;

        // get access to the value in various ways
        var sumResult = phase.GetObject<int[]>();
        var objResult = phase.GetObject<CustomType>();
        var stringResult = phase.Value.FromRiakString();
    }
}
{% endhighlight %}

## The End ##

Congrats! You're now a Map/Reduce guru!

Long term we'll looking to build a LINQ provider for this interface, but we're keeping this a lower priority than other features we deem as more important. If this is a deal-breaker, [get in touch][GetInTouch]!

[GetInTouch]: https://github.com/DistributedNonsense/CorrugatedIron/issues "CorrugatedIron issues"
[KeyFilterDocs]: /documentation/MapReduce.KeyFilters.html
[MRInputs]: http://wiki.basho.com/MapReduce.html#Inputs "Riak Map/Reduce Inputs"
[MRPhases]: http://wiki.basho.com/MapReduce.html#Phase-functions "Riak Map/Reduce Phase Functions"
[MRWiki]: http://wiki.basho.com/MapReduce.html "Riak Map/Reduce"
[MR]: http://en.wikipedia.org/wiki/MapReduce "Map/Reduce definition"
[RiakBucketKeyArgInput.cs]: https://github.com/DistributedNonsense/CorrugatedIron/blob/master/CorrugatedIron/Models/MapReduce/Inputs/RiakBucketKeyArgInput.cs "RiakBucketKeyArgInput class"
[RiakBucketKeyInput.cs]: https://github.com/DistributedNonsense/CorrugatedIron/blob/master/CorrugatedIron/Models/MapReduce/Inputs/RiakBucketKeyInput.cs "RiakBucketKeyInput class"
[RiakFluentActionPhaseErlang.cs]: https://github.com/DistributedNonsense/CorrugatedIron/blob/master/CorrugatedIron/Models/MapReduce/Fluent/RiakFluentActionPhaseErlang.cs "RiakFluentActionPhaseErlang class"
[RiakFluentActionPhaseJavascript.cs]: https://github.com/DistributedNonsense/CorrugatedIron/blob/master/CorrugatedIron/Models/MapReduce/Fluent/RiakFluentActionPhaseJavascript.cs "RiakFluentActionPhaseJavascript class"
[RiakFluentLinkPhase.cs]: https://github.com/DistributedNonsense/CorrugatedIron/blob/master/CorrugatedIron/Models/MapReduce/Fluent/RiakFluentLinkPhase.cs "RiakFluentLinkPhase class"
[RiakKeyFilters]: http://wiki.basho.com/Key-Filters.html "Key Filter in Riak"
[RiakLink]: https://github.com/DistributedNonsense/CorrugatedIron/blob/master/CorrugatedIron/Models/RiakLink.cs "RiakLink class"
[RiakLinks]: http://wiki.basho.com/Links.html "Links in Riak"
[RiakMapReduceQuery.cs]: https://github.com/DistributedNonsense/CorrugatedIron/blob/master/CorrugatedIron/Models/MapReduce/RiakMapReduceQuery.cs "RiakMapReduceQuery class"
[fluent]: http://en.wikipedia.org/wiki/Fluent_interface "Fluent Interface"
