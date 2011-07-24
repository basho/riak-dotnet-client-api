---
layout: default
title: CorrugatedIron Features
heading: Killer <strong>Features</strong>
subheading: What it <em>can</em> do and what it <em>will</em> do
menuitem: Features
---

Current Features
----------------

The current released of CorrugatedIron, v0.1.0, has the following features:

* Riak cluster support:
    * One or more nodes in the cluster.
    * Load-balancing and **pooling** of connections across the nodes.
        * Currently only round-robin is supported, more strategies to come later.
    * Per-node configuration for:
        * Host Name (purely used for identification).
        * Host Address.
        * PBC Port.
        * HTTP/REST Port.
        * Pool Size.
        * Timeout parameters.
* Server ping. &nbsp;&nbsp;&nbsp;&hearts;
* Get server information/version. &nbsp;&nbsp;&nbsp;&hearts;
* Simple Get/Put/Delete operations. &nbsp;&nbsp;&nbsp;&hearts;
* Bulk Get/Put/Delete operations. &nbsp;&nbsp;&nbsp;&hearts;
* List buckets. &nbsp;&nbsp;&nbsp;&hearts;
* List keys. &nbsp;&nbsp;&nbsp;&hearts;&nbsp;&nbsp;&laquo;
* Semi-fluent Map/Reduce. &nbsp;&nbsp;&nbsp;&hearts;&nbsp;&nbsp;&laquo;
* Link walking. &nbsp;&nbsp;&nbsp;&hearts;
* Delete buckets. &nbsp;&nbsp;&nbsp;&hearts;
* Set/Get bucket properties. &nbsp;&nbsp;&nbsp;&hearts;
* Batch operations on a single connection.
    * Each time a Client function is called resulting in communication with the Riak
      cluster, a connection is pulled from a pool on a given node. In most use-cases this
      functionality is fine as it is often single-shot calls that are made. There are,
      however, cases where many operations will happen at once. Rather than forcing the
      user to make multiple calls to the client, resulting in multiple connection
      acquisitions behind the scenes, the user can use the Batch interface to make many
      calls on a single connection. This also reduces the overhead of setting the client
      ID on each call as well.
    * Because a batch operation reuses a single connection only a subset of the client
      API is available for batch actions. The functions that are excluded are the
      asynchronous functions.
* Graceful degrade to HTTP/REST API when the request isn't supported via Protocol Buffers.
* Works with .NET 4.0 on Windows, and Mono on Linux and OSX.

<small>*&hearts;: denotes availability of both blocking and asynchronous APIs*<br/>
*&laquo;: denotes availability of both streaming and non-streaming APIs*</small>

Upcoming Features
-----------------

The authors are currently working the following features (though there are no dates yet as to when they will be ready):

* Improved self-healing of connections and management of nodes.
* Connection idling.
* Support for Riak Search and Luwak.
* LINQ expression parsing for Map/Reduce queries.
* Incorporating feature requests and bug fixes.

Unplanned Features
------------------
* **.NET 3.5 support** - after careful consideration we decided to not worry about
  adding support for .NET 3.5 applications. The main reason for this is that Riak is new
  to the .NET world and any applications that aim to talk to Raik will most likely be
  new applications themselves and hence would use the latest version of .NET (v4.0 at the
  time of writing). If the community feels that .NET 3.5 support is required then we can
  look into the options around adding support. At this stage, we don't think it's worth
  the effort when we could instead be adding new features to the client.

