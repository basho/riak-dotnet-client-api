---
layout: default
title: Query Options
heading: Controlling Query Behavior in <strong>CorrugatedIron</strong>
subheading: How to tune Riak's consistency behavior
menuitem: Documentation
---

## Query Options: An Overview

In the section on [basic operations][ci_basic] we briefly touched on _n_, _r_, and _w_ configuration parameters. Just to recap:

* _n_ is the number of virtual nodes in the Riak cluster that will store data
* _r_ is the number of nodes that must respond to a read request before data is returned to the client
* _w_ is the number of nodes that must respond to a write request before the record can be safely considered to be written

Every request accepts a value for these parameters, but if the parameters aren't present RIak will make some assumptions about how it should behave. By default, Riak assumes that _n_, _r_, and _w_ are set to 2 (technically it defaults to (_n_/2) + 1, but who's checking?). You can change this behavior at the Riak cluster level by modifying the [`default_bucket_props` section of `riak_core_settings`][basho_config] in `app.config` or on a per bucket basis.

## Changing Bucket Behavior

Not only can bucket properties change _n_, _r_, and _w_ semantics, but they can also be used to set pre and post commit hooks, enable Riak Search, and change sibling semantics. 

### Available Bucket Properties

A number of properties are available at the bucket level:

* **`LastWriteWins`** - When set to true, riak will ignore vector clocks and cheerfully overwrite data. When `LastWriteWins` is false, siblings may be created if conflicts exist within Riak. `LastWriteWins` defaults to true.
* **`AllowMultiple`** - If this is true, it's possible for siblings to be created by concurrent updates. `AllowMultiple` defaults to false.
* **`Search`** - Setting this to true will enable Riak Search for a single bucket, but it won't index the contents of the bucket. Refer to [Riak Search - Indexing][basho_rsi] for details. Riak Search is disabled by default.
* **`NotFoundOk`** - When set to true, an object not being found on a Riak node will count towards the _r_ count. `NotFoundOk` defaults to true.
* **`BasicQuorum`** - This tells Riak to return early in certain failure conditions. E.g. if _r_ = 1 and Riak returns two errors and a success, having `BasicQuorum` set to true would return an error.
* **`Backend`** - If you've configured riak to use the `riak_kv_multi_backend` setting, it's possible to change the backend on a bucket by bucket basis. Backends are covered in [Choosing a Backend][basho_backends].
* **`PreCommitHooks`** and **`PostCommitHooks`** - [Commit hooks][basho_ch] are loosely analagous to triggers in a relational database. They can be used to perform data validation or to take action after data has been saved. 

### Reading Bucket Properties

Unfortunately, only some properties can be loaded through the Protocol Buffers interface. CorrugatedIron was built with speed in mind, but will default to an HTTP interface when necessary. Retrieving all bucket properties requires an HTTP request, so make sure you set the `extended` flag to `true` when you attempt to read bucket properties. If you don't, CorrugatedIron will return `null` in place of the current value.

{% highlight csharp %}
var result = Client.GetBucketProperties(bucket, true);
{% endhighlight %}

### Setting Bucket Properties 

Setting bucket properties in Riak is a simple operation. Just like any other operation in Riak, it's best to retrieve data first, verify that you aren't overwriting existing parameters, and then save the data back to Riak. To make life easier, `RiakBucketProperties` provides a fluent interface.

{% highlight csharp %}
// We're making sure to grab extended properties by passing in true
var result = Client.GetBucketProperties(theBucket, true);

// Just a friendly reminder that you should always check your results
if (!result.IsSuccess) 
	throw new Exception("Ummm... couldn't read the properties.");

var properties = result.Value;

properties.SetNVal(5)
		  .SetAllowMultiple(true)
		  .SetRVal("quorum")
		  .SetWVal("all");

var setResult = Client.SetBucketProperties(theBucket, properties);

if (!setResult.IsSuccess)
	throw new Exception("Ummm... couldn't set the properties.");
{% endhighlight %}

You'd assume that _r_ and _w_ need to be set to a numeric value. That's only partially true. _r_ and _w_ can also be set to a string so long as that string is either `"all"`, `"quorum"`, or `"one"`. The default is `"quorum"`.

There are several other bucket properties that we haven't discussed `DwVal` and `RwVal`. 

**`DWVal`** is the durable write parameter. A durable write is a write that has been acknowledged as being fully written to disk - as opposed to in the operating system's file cache. Users who are particularly concerned about data durability will want to set the `DwVal`. By default, Riak does not wait for a durable write to be committed and, instead, trusts the operating system and the resilience provided by having multiple copies of the data on multiple servers.

**`RwVal`** is used for deletes. This is the number of replicas that must return before a delete is considered complete. 

## Data Retrieval Properties

The `RiakGetOptions` class provides a convenient way to create a set of querying options. Through `RiakGetOptions` it's possible to modify the behavior of the following properties:

* R
* PR
* Basic Quorum
* NotFound OK

In addition, the `RiakGetOptions` allow you to specify different behavior for a single Get request.

* **`Head`** - The `Head` option is particularly useful if you only need to inspect the metadata of a large object. When `Head` is `true`, Riak will only return object metadata.
* **`DeletedVclock`** - Returns an object's delete tombstone vclock, if applicable.
* **`IfModified`** - The `IfModified` option allows a user to specify a single vector clock as an array of bytes. If the value stored in Riak has a different vector clock, an object will be returned. This can be useful in polling applications where you don't want to ship a large object back to the client for comparison.


[ci_basic]: http://corrugatediron.org/documentation/Basics.Querying.html
[basho_config]: http://docs.basho.com/riak/latest/references/Configuration-Files/
[basho_rsi]: http://docs.basho.com/riak/latest/cookbooks/Riak-Search---Indexing/
[basho_ch]: http://docs.basho.com/riak/latest/references/appendices/concepts/Commit-Hooks/
[basho_backend]: http://docs.basho.com/riak/latest/tutorials/choosing-a-backend/