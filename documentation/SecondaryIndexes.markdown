---
layout: default
title: Secondary Indexes
heading: Secondary <strong>Indexes</strong>
subheading: An introduction to Secondary Indexes
menuitem: Documentation
---

Riak has built-in support for [Secondary Indexes][2i] (2i) which gives the ability to find values based on non-key values. Here's a snippet from the 2i documentation on Basho's website:

> Secondary Indexing (2i) in Riak gives developers the ability,
> at write time, to tag an object stored in Riak with one or more
> queryable values.
> 
> Since the KV data is completely opaque to 2i, the user must tell
> 2i exactly what attribute to index on and what its index value
> should be, via key/value metadata. This is different from Search,
> which parses the data and builds indexes based on a schema. Riak
> 2i currently requires the LevelDB backend.

As you can see there is a requirement that your Riak cluster be configured to use the [LevelDB backend][eleveldb] if you require use of 2i. For detail on how to set this up please refer to Basho's [2i Configuration wiki page][2iConfig].

## 2i in CI ##

**CorrugatedIron** has full support for creating, querying and removing secondary indexes in Riak. Behind the scenes the [PBC][] interface is used to perform all of these functions.

The [RiakObject][] class is where 2i operations are managed and hence this is the point of call when you are looking to do something with 2i.

It is worth noting that as of **CorrugatedIron v1.3.0** the `IntIndex()` functionality was changed from `int` to `BigInteger` because Riak actually uses the bigger integers behind the scenes.

### Creating an Index ###

Given that Riak supports two types of indexes, `binary` and `integer`, **CorrugatedIron** provides two interface functions for dealing with indexes, they are `BinIndex()` and `IntIndex()`. They both operate in a similar way and are quite easy to use.

Here is some sample code that shows how to add indexes of various types:

{% highlight csharp %}
// Create an object to store in Riak
var me = new RiakObject("person", "oj", "{ age: 34, first_name: \"Oliver\" }");

// set an integer index of a given name
me.IntIndex("age").Set(34);

// set a binary index the same way
me.BinIndex("nationality").Set("Australian");

// got more than one value? You can add another without deleting existing ones
me.BinIndex("nationality").Add("English");

// Set more than one value at once
me.BinIndex("nationality").Set("Australian", "English");

// Add more than one value at once
me.BinIndex("nationality").Add("Swahili", "Danish");

// Overwrite an existing set of values
me.BinIndex("names").Add("Doris"); // that's not right!
me.BinIndex("names").Set("OJ", "Oliver", "Derpus"); // overwrites existing

// remove a vale
me.BinIndex("names").Remove("Derpus");

// remove all values
me.BinIndex("names").Clear();

// remove the index itself off the object.
me.BinIndex("names").Delete();

// use IEnumerables of stuff instead
var names = new List<string> { ... };
me.BinIndex("names").Set(names);

// work fluently
me.IntIndex("fav_nums")
    .Add(10)
    .Add(40)
    .Add(50, 30, 20)
    .Remove(40)
    .Add(listOfNumbers);

// store in Riak
Client.Put(me);

// Look at any existing values in an index:
foreach(var value in me.IntIndex("fav_nums").Values)
{
    // do something with value
}
{% endhighlight %}

When adding values to an index, all duplicates are removed prior to sending to Riak. Even though Riak has built-in functionality that removes duplicate secondary index values we remove them on the client so that we don't send unnecessary traffic across the wire.

### Querying an Index ###

As of Riak v1.2, querying secondary indexes can be done via Map/Reduce or via the [PBC][] interface. **CorrugatedIron** supports both of these methods.

#### Querying via Map/Reduce ####

To use the Map/Reduce functionality to search for objects that match an index you need the following information:

* The name of the index you wish to query.
* The exact value of the index you are looking for, or a range in which the value must fit.

With those bits of information it is possible to set up a query like so:

{% highlight csharp %}
// Exact value query which uses M/R
var query = new RiakMapReduceQuery()
    .Inputs(RiakIndex.Match("person", "age", 34))
    .MapJs(m => m.Name("Riak.mapValuesJson").Keep(true));

var result = Client.MapReduce(query);
// result now contains the phase results which includes the body
// of those objects which match the index given
var items = result.Value.PhaseResults.SelectMany(x => x.GetObjects<dynamic>());
{% endhighlight %}

Here's how you might do a range query:

{% highlight csharp %}
// Exact value query which uses M/R
var query = new RiakMapReduceQuery()
    .Inputs(RiakIndex.Range("person", "age", 30, 40))
    .MapJs(m => m.Name("Riak.mapValuesJson").Keep(true));

var result = Client.MapReduce(query);
// result now contains the phase results which includes the body
// of those objects which match the index given
var items = result.Value.PhaseResults.SelectMany(x => x.GetObjects<dynamic>());
{% endhighlight %}

As you can see this conforms to the typical usage of Map/Reduce queries. To see more information about Map/Reduce queries in **CorrugatedIron** take a look at the [Map/Reduce documentation][CI.MapReduce].

To invoke a query on a `binary` index, simply perform the same function but pass in `string` instances instead of `int` instances to the `RiakIndex.Match()` and `RiakIndex.Range()` functions.

### Querying via PBC ###

There is one important difference to not when dealing with the PBC interface compared to the Map/Reduce interface and that is that the PBC interface will only return a list of keys which represent the objects matched by the index query. To get the body of the objects that match a second query will need to be run. This could be a Map/Reduce query or simple `Get()`.

The [RiakClient][] has a function called `IndexGet` which has 4 overloads. Each overload provides a combinations of `int` or `binary` indexes with `match` or `range` semantics. For example, to query Riak and retrieve a collection of `string` values representing keys that match an object which has a `binary` property called `age` with a value of `"34"`, the following call can be made:

{% highlight csharp %}
var result = Client.IndexGet("person", "age", "34");
// result.Value contains the list of keys
{% endhighlight %}

Similarly the do a range query on an integer key, the following call can be made

{% highlight csharp %}
var result = Client.IndexGet("person", "age", 30, 40);
// result.Value contains the list of keys
{% endhighlight %}

The list of keys can then be used for subsequent queries.

## Removing an Index ##

Removing an index from an object is as simple as creating the index in the first place. Instead of calling `AddIndex()` on the `RiakObject` instance, you call `Remove???Index()` where `???` is either `Bin` or `Int`. The reason the **CorrugatedIron** API requires separate calls in this instance is because it is possible for an object to have both a `binary` and an `integer` index of the same name. Without anything else to go on, **CorrugatedIron** needs to be told which of those indexes is to be removed by identifying the type of the index.

{% highlight csharp %}
// Grab an object from Riak
var me = Client.Get("person", "oj");

// remove the age index
me.RemoveIntIndex("age");

// save the changes
Client.Put(me);
{% endhighlight %}

## That's it! ##

Congratulations, you've mastered 2i handling in **CorrugatedIron**.

  [RiakClient]: https://github.com/DistributedNonsense/CorrugatedIron/blob/master/CorrugatedIron/RiakClient.cs
  [eleveldb]: https://github.com/basho/eleveldb
  [CI.MapReduce]: /documentation/MapReduce.html
  [PBC]: http://docs.basho.com/riak/latest/references/apis/protocol-buffers/
  [2i]: http://docs.basho.com/riak/latest/tutorials/querying/Secondary-Indexes/
  [2iConfig]: http://docs.basho.com/riak/latest/cookbooks/Secondary-Indexes---Configuration/
  [RiakObject]: https://github.com/DistributedNonsense/CorrugatedIron/blob/master/CorrugatedIron/Models/RiakObject.cs

