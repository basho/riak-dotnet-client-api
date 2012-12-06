---
layout: default
title: Secondary Indexes
heading: Secondary <strong>Indexes</strong>
subheading: An introduction to Secondary Indexes
menuitem: Documentation
---

Riak has built-in support for [Secondary Indexes][2i] (2i). Here's a snippet from the documentation:

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

The [RiakObject][] class is where 2i operations are managed. It maintains a property called `Indexes` which is a dictionary of `string` (index name) to `string` (index value). This property contains both `binary` and `integer` indexes (for more information on index types refer to the [Basho wiki][2i]. While this is interesting to developers, this is often used just for information purposes and nothing more. There are other methods which should be used to interact with 2i.

### Creating an Index ###

Given that Riak supports two types of indexes, `binary` and `integer`, **CorrugatedIron** provides two overloaded interface functions for dealing adding indexes. The overloaded functions use the types that are passed in to determine which type of index to create.

Here is sample code which shows how to create an object with one `integer` and one `binary` index, which is then stored in Riak.

{% highlight csharp %}
// Create an object to store in Riak
var me = new RiakObject("person", "oj", "{ age: 34, first_name: \"Oliver\" }");

// add an integer index by using the AddIndex() function and passing
// in an integer value
me.AddIndex("age", 34);

// add a binary index by using the AddIndex() function and passing
// in a string value
me.AddIndex("first_name", "Oliver");

// store in Riak
Client.Put(me);
{% endhighlight %}

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

The [IRiakClient][] interface has a function called `IndexGet` which has 4 overloads. Each overload provides a combinations of `int` or `binary` indexes with `match` or `range` semantics. For example, to query Riak and retrieve a collection of `string` values representing keys that match an object which has a `binary` property called `age` with a value of `"34"`, the following call can be made:

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

  [eleveldb]: https://github.com/basho/eleveldb
  [CI.MapReduce]: /documentation/MapReduce.html
  [PBC]: http://docs.basho.com/riak/latest/references/apis/protocol-buffers/
  [2i]: http://docs.basho.com/riak/latest/tutorials/querying/Secondary-Indexes/
  [2iConfig]: http://docs.basho.com/riak/latest/cookbooks/Secondary-Indexes---Configuration/
  [RiakObject]: https://github.com/DistributedNonsense/CorrugatedIron/blob/master/CorrugatedIron/Models/RiakObject.cs

