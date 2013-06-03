---
layout: default
title: Map/Reduce Queries
heading: Map/Reduce <strong>Queries</strong>
subheading: An introduction to Map/Reduce queries
menuitem: Documentation
---

Key/Value stores are designed for key-based lookups; ad hoc queries are typically not well supported. The [Map/Reduce][MR] model is a feature of Riak that makes it possible to perform diverse operations on data, including querying, filtering, and aggregating information.

Full documentation of the Map/Reduce features available in Riak can be found on the [Riak Map/Reduce wiki page][MRWiki]. This article covers how to use these features in CorrugatedIron, but doesn't cover the features themselves.

## Preparing the job ##

CorrugatedIron provides a simple class which is the first point of call for writing Map/Reduce queries. That class is named [`RiakMapReduceQuery`][RiakMapReduceQuery.cs] and has a [fluent][]-style interface which makes it easy to create rich ad hoc queires.

You can begin by simply creating a new `RiakMapReduceQuery` object:

{% highlight csharp %}
var query = new RiakMapReduceQuery();
{% endhighlight %}

After creating an instance, you'll want to specify the [inputs][MRInputs] for the Map/Reduce job. Inputs can be specified in three different ways - as a Bucket, as a list of Bucket/Key pairs, as a Bucket/Key/Argument triple.

### Job Inputs ###

* *Bucket Name* - A single string value that indicates the job should operate on all the keys within that bucket.
* *Bucket/Key Pairs* - A list of [RiakBucketKeyInput][RiakBucketKeyInput.cs] instances which represent the Bucket/Key pairs which the job should operate on.
* *Bucket/Key/Arg Triple* - A list of [RiakBucketKeyArgInput][RiakBucketKeyArgInput.cs] instances which represent the Bucket/Key pairs, along with a per-item argument, which the job should operate on.

Here is how you would specify a single bucket input:

{% highlight csharp %}
var query = new RiakMapReduceQuery()
    .Inputs("BucketName");
{% endhighlight %}

To specify Bucket/Key pairs, do the following:

{% highlight csharp %}
var inputs = new RiakBucketKeyInput()
    .Add("bucket1", "key1")
    .Add("bucket2", "key2")
    .Add("bucket3", "key3");

var query = new RiakMapReduceQuery()
    .Inputs(inputs);
{% endhighlight %}

To specify Bucket/Key/Arg triples, do the following:

{% highlight csharp %}
var inputs = new RiakBucketKeyInput()
    .Add("bucket1", "key1", 3.1415)
    .Add("bucket2", "key2", "slartibartfast")
    .Add("bucket3", "key3", new { foo = "bar", baz = 10 });

var query = new RiakMapReduceQuery()
    .Inputs(inputs);
{% endhighlight %}

Now that the inputs have been specified, the next step is to write a series of Map and Reduce phases.

### Phase types and languages ###

Riak supports several types of [phases][MRPhases] to be run during a Map/Reduce job; each type of phase can be specified more than once. Each phase type is matched with one or more methods in the `RiakMapReduceQuery` class. Each one of these methods takes a single parameter - an `Action<T>`. The type `T` for each action will vary depending on the phase and language that the phase is executed with. The instance of `T` being passed has all the methods and properties  available for the phase and language type. The action passed in as a parameter operates on the instance of `T` to configure that phase.

The phase methods correspond to the languages that Riak supports for Map/Reduce operations: `MapJs()` and `MapErlang()`.

#### MapJs() ####

The `MapJs` method creates a **Map** phase using Javascript to describe the mapping. The action parameter for this function call is of type [`RiakFluentActionPhaseJavascript`][RiakFluentActionPhaseJavascript.cs] and can also be configured in a fluent style. This class contains the following methods:

* `Keep(bool)` - tells CorrugatedIron that the results of this phase should be kept or discarded.
* `Argument<T>(T)` - specifies the argument to pass in to the phase for each bucket/key pair that is processed during the phase.
* `Name(string)` - specifies the name of a built-in Javascript Map function to use for this phase (such as `"Riak.mapValuesJson"`).
* `Source(string)` - specifies the full source, in Javascript, of the function to execute for this phase.
* `BucketKey(string, string)` - specifies the Bucket name and Key name which indicates the location, inside Riak, of the object which contains the Javascript source function to use during this phase.

`Name()`, `Source()`, and `BucketKey()` are mutually exclusive. Only one of these values should be set. If more than one of these is set an exception will occur when the Map/Reduce query is executed.

Both the `Keep()` and `Argument()` can be set at any time along with any of the other functions. They are not mutually exclusive.

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

`MapErlang()` is a **Map** phase using _Erlang_ instead of Javascript as the source language. The big difference with `MapErlang()` is that you can't write Erlang source code and pass that in as a parameter like you can with `MapJs()`. To put it another way: there are no ad hoc Erlang functions in Riak Map/Reduce.

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

Both `ReduceJs()` and `ReduceErlang()` have interfaces that match their **Map** counterparts. The functions they expose are also the same.

Here's an example:

{% highlight csharp %}
var query = new RiakMapReduceQuery()
    .Inputs("BucketName")
    .MapJs(m => m.Source(@"function(o){return[1];}"))
    .ReduceJs(m => m.Name(@"Riak.reduceSum").Keep(true));
{% endhighlight %}

#### Link() ####

`Link()` gives callers the ability to access linked items via Riak's [link][RiakLinks] capability. `Link()` expects an action which takes a [`RiakFluentLinkPhase`][RiakFluentLinkPhase.cs]. Without digging too deep, links point to a record in another bucket and can be identified by a separate tag. This class has the following methods:

* `Keep(bool)` - tells CorrugatedIron that the results of this phase should be kept or discarded.
* `Bucket(string)` - the bucket to examine for links.
* `Tag(string)` - if supplied, all links returned will have this tag.
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

Riak provides the ability to rapidly filter keys by using a set of search predicates using [key filters][RiakKeyFilters]. 

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

**Order cannot be guaranteed with streaming API calls.** It is up to the caller to guarantee that they are working with the correct result phase when parsing Map/Reduce results.

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

### Future Plans ###
Long term we'll looking to build a LINQ provider for this interface, but this is a low priority feature. If this is a deal-breaker for you, [get in touch][GetInTouch]!

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
