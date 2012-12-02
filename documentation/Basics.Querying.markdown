---
layout: default
title: Getting Started
heading: Basic Operations in <strong>CorrugatedIron</strong>
subheading: How to do basic operations with CorrugatedIron
menuitem: Documentation
---

There are three basic operations you can perform on data with Riak: get, put, and delete. 

## Referencing Data in Riak ##

All data in Riak is referenced by a bucket/key pair. A bucket is a logical namespace for keys. A key must be unique within a bucket, but can be any format you'd like. Here are a few examples showing a user, a tweet, a stock price at a certain time, and a request in a log:

    User\jeremiah.peschka@example.org
    tweets\19373940183473481
    stocks\MSFT:2011-07-29T180300Z
    http_log\169.132.4.9~2011-07-26T053212Z~http://corrugatediron.org/images/logo.png

### A Diversion About n, r, and w ###

A Riak cluster has some arbitrary number of physical nodes. In order to protect your data, Riak stores your data on more than one node. The number of nodes that store your data is referred to as the *n* value. *N* may be anything between 1 and the number of nodes in your cluster. There is also an *r* value and *w* value. *R* is the number of nodes that have to respond to a read request before data is returned to the client. *W* is the number of nodes that have to acknowledge a command to write a record before that record is considered to have been written.

## Getting Data ##

The RiakClient API has a simple `Get(string bucket, string key, unit rVal)` method that makes reading from Riak easy. Since a key is uniquely identified by a bucket/key combination, the only thing that you need to do to find a single key is look it up using that bucket/key combination.

{% highlight csharp %}
var result = Client.Get("my_bucket", "my_key");
var myObject = result.Value.GetObject();
{% endhighlight %}

That's it, really. `Get()` returns an instance of `RiakResult<RiakObject>`. `RiakResult<RiakObject>` has a few properties and methods, but the important ones here are `IsSuccess`, `ErrorMessage`, `ResultCode`, and `Value`.

### RiakResult.IsSuccess ###

As long as your attempt to talk to Riak is successful, `IsSuccess` will be true. Any attempt to talk to Riak that doesn't fail through an inability to talk to talk to the server somehow (network connection error, bad request, etc) is considered a success. Not finding a record is considered to be a success. 

When a response is returned from Riak, it's important to check `IsSuccess`. This is an immediate indicator of what happened during the request, but it's also important to examine the `ResultCode`.

### Dealing with Failure ###

{% highlight csharp %}
var result = Client.Get("my_bucket", "missing_key");

if (result.IsSuccess) {
  return result.Value.GetObject();
} else {
  // what now, brown cow>?
}
{% endhighlight %}

Wherever possible, CorrugatedIron will fail by delivering an error message to the user. We've reserved exceptions for exceptional events. As a result, developers will need to examine status messages from CorrugatedIron. This reflects how Riak communicates with calling clients - whenever possible Riak tries to do the right thing and inform clients of what is happening within the cluster.

### RiakResult.ResultCode ###

`RiakResult.ResultCode` is an enumeration representing one of a handful of messages that Riak can return. The different values of `ResultCode` are self-explanatory, they are listed here for the sake of explanation:

  * Success
  * ShuttingDown
  * NotFound
  * CommunicationError
  * InvalidResponse
  * ClusterOffline
  * NoConnections

**N.B.** A `RiakResult.ResultCode` of `NotFound` does not indicate that the bucket/key combination was not found in Riak. It means that a bucket/key comination was not found based on the nodes queried and the *n*, *r*, and *w* values being used. Assuming *n* = 5, *r* = 2, and *w* = 2, it's easy to imagine a situation where a write can be followed by a read and the client sees a `NotFound` result.

### RiakResult.Value ###

As long as the communication with Riak is a success and there is a record in Riak, `RiakResult.Value` will contain an instance of `RiakObject`. `RiakObject` is a wrapper around the data stored in Riak. In additional to containing the data stored in Riak, `RiakObject` also contains metadata kept by Riak.

### What about rVal? ###

The `rVal` parameter is optional. Because Riak stores multiple copies of your data, you can tell Riak how many nodes must successfully respond to a read request before the data is returned to the client. The default is floor(n/2) + 1 where *n* is the number of nodes in the Riak cluster that should contain data (this defaults to 3). With an unmodified Riak configuration, the default `rVal` is 2.

A successful read request occurs when `rVal` number of nodes respond with *the same* copy of the data. If you want to make absolute sure that you are reading the correct version of data, make sure that `rVal` is set to *n* (the number of nodes with your data). Of course, if you'd rather get your data as fast as possible, you can set `rVal` to 1 and hope that you get the correct copy of the data.

## Writing Data ##

Writing data is just as easy as reading it:

{% highlight csharp %}
var object = new RiakObject("bucket", "key", { something = "value"; something_else = 3 });
object.ContentType = "application/json";
Client.Put(object);
{% endhighlight %}

Actually, writing data is probably easier than reading it. When you read data, you have to figure out if there is actually there when the read is done. When you write data to Riak, that worry is gone (for the most part). If you've ever worked with a relational database you've probably written code to detect if an object is new or not and save it in one of several different ways. Saving data to Riak is a matter of pushing data at Riak. If there's already a key in a bucket, the key is overwritten. If bucket/key combo doesn't exist, a new record is inserted. Riak takes care of that mess for you.

### What About W? ###

Way back at the beginning, I mentioned *n*, *r*, and *w* values. Changes to *w* only make sense during writes. The `Put` method accepts an optional parameter: `RiakPutOptions`. `RiakPutOptions` lets you change three things about how a write behaves: *w*, *dw*, and the return body.

*W* is the number of nodes that have to acknowledge a write before it is considered successful. *DW* is short for durable write. A durable write is different from a normal write. Normally when any application issues a write, the operating system acknowledges the write. The data may or may not be living in a filesystem cache (in memory) when the write is acknowledged. That information might eventually be flushed to disk, but we can trust that it will make it there eventually, so long as nothing catastrophic happens. A *durable* write tells the OS that we want to make damn sure that our data is on disk and that we'll wait around until we get an acknowledgement from some spinning rust, thankyouverymuch.

The last possible option is `ReturnBody`. When `ReturnBody` is true, you're tell Riak that you want to receive the most recent copy of the object back along with the write acknowledgement. This could be a good idea in development environments (or when troubleshooting strange behavior in production), but on the whole returning a copy of the data you just saved is overly chatty and an excellent way to add congestion to your network.

### Content Types, Serialization, and You ###

Although `ContentType` can be set to any arbitrary value, it's considered polite to set the `ContentType` to something that other applications will understand. Typical values come from the [IANA MIME Media Types][mime_list] list.

CorrugatedIron will automatically handle converting objects to the appropriate `ContentType` if you supply a content type for JSON, Protocol Buffers, XML, or plain text. We make use of several libraries to make this possible, but that doesn't mean you're limited to our choices. You can easily specify a custom serialization method - so long as it converts your custom object to a byte array.

{% highlight csharp %}
var object = new RiakObject("bucket", "key");
object.SetObject(myMathematicaObject, 
                 "application/mathematica", 
                 myMathematicaToByteArrayConversionDelegate);
Client.Put(object);
{% endhighlight %}

When it's time to read that Mathematica object back from Riak, you can do the same thing:

{% highlight csharp %}
var result = Client.Get("bucket", "key");
var value = result.Value;
var myMathematicObject = value.GetObject<Mathematica>(myMathematicFromByteArrayConversionDelegate);
{% endhighlight %}

### Deleting Data ###

A delete is a lot like reading data - the object to be deleted is identified by a bucket/key combination. 

[mime_list]: http://www.iana.org/assignments/media-types/index.html "IANA Mime Media Types"