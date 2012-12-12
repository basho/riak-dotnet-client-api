---
layout: default
title: Riak Search
heading: Riak <strong>Search</strong>
subheading: Getting your Riak Search on
menuitem: Documentation
---

As of version 1.0 **CorrugatedIron** comes with a fluent interface for performing searched on your Riak cluster. This documentation is intended to show you how to perform queries to extract detail from your data based on the results of those queries.

Before going into the detail of how to query using Search it is worth pointing out that it is best to thoroughly read the [Riak Search][SearchWiki] so that all the concepts are clear. This will also help you get set up. For those who aren't keen on doing that, we cover off the basics here but please be aware that Basho's wiki is the source of truth.

## Enabling Riak Search ##

Before **CorrugatedIron** can perform Riak Search queries on your data, search must first be enabled in two locations in your cluster. Firstly, the `app.config` file of your nodes must be updated such that the `riak_search` settings have the `enabled` value set to `true`, like so:

{% highlight erlang %}
...
%% Riak Search Config
{riak_search, [
                %% To enable Search functionality set this to 'true'
                {enabled, true}
              ]},
...
{% endhighlight %}

Nodes must be restarted for this setting to take effect.

Secondly, for each bucket that you wish to perform Search queries on, you must enable indexing using the command-line tools. For example, if you wanted to perform queries over the `person` bucket, you need to enable search on that bucket using the following command:

    bin/search-cmd install person

For more thorough documentation please refer to the [Riak Search][SearchWiki] wiki.

## Constructing a Search Query ##

Riak Search is very powerful and hence the structure of search queries can be a little complex depending on what you're looking for. **CorrugatedIron**'s search interface is designed to be fluent in the hope that it makes it easier to construct these search queries without the user needing to know the ins and outs of the Riak Search syntax.

To get started you first need to create an instance of `RiakFluentSearch`, which requires two parameters during construction:

1. The name of the bucket that the search will be performed on.
1. The name of the field which the query will look at.

Note: While during the construction of the query the name of the field is required, it is possible to include other fields in the query, so don't panic!

{% highlight csharp %}
var search = new RiakFluentSearch("my_bucket", "field_to_perform_search_on");
{% endhighlight %}

This object instance will give you access to all the fluent features of the API. From here the simplest search is to specify a single value.

{% highlight csharp %}
var search = new RiakFluentSearch("people", "name")
  .Search("Bob")
  .Build();
{% endhighlight %}

The search object now knows that the name you're looking for is `Bob`. If you were also looking for `Alice`, the query would look like this:

{% highlight csharp %}
var search = new RiakFluentSearch("people", "name")
    .Search("Bob")
    .Or("Alice")
    .Build();
{% endhighlight %}

### Boost ###

If you want to boost a particular part of the query term, you can do it using the `Boost(n)` function like so:

{% highlight csharp %}
var search = new RiakFluentSearch("people", "name")
    .Search("Bob").Boost(10)
    .Or("Alice").Boost(5)
    .Or("Eve")
    .Build();
{% endhighlight %}

The above query boosts `Bob` by `10` and `Alice` by `5`.

### Proximity ###

If you're interested in returning documents which have a set of words that are within a certain proximity of each other, you can use the `Proximity` query:

{% highlight csharp %}
var search = new RiakFluentSearch("people", "name")
    .Proximity(10, "these", "words", "should", "be", "close")
    .Build();
{% endhighlight %}

The Proximity function can take any number of words.

### Ranges ###

Sometimes you will need to search for a range of values. If, for example, you're looking for a person with an age between 30 and 35 inclusive, you can do the following:

{% highlight csharp %}
var search = new RiakFluentSearch("people", "age")
    .Between(30, 35);
{% endhighlight %}

If you want the results to be exclusive of the specified value then just call the overload that indicates `false` for the `inclusive` parameter:

{% highlight csharp %}
var search = new RiakFluentSearch("people", "age")
    .Between(30, 35, false);
{% endhighlight %}

### Wildcards ###

Sometimes you might only know part of the value that you're searching for, so you might want to do a search for people whose names begin with `Jo`. This can be achieved like so:

{% highlight csharp %}
var search = new RiakFluentSearch("people", "name")
    .Search(Token.StartsWith("Jo"))
    .Build();
{% endhighlight %}

### Multiple Fields ###

Search queries have to start with a single field, which is why the main constructor requires it. However there often times where you want to have a query which spans across multiple values. If we want to find all people with names starting with `Jo` that are between `30` and `35` years of age, what do we do? We do the following:

{% highlight csharp %}
var search = new RiakFluentSearch("people", "name")
    .Search(Token.StartsWith("Jo"))
    .AndBetween("age", 30, 35)
    .Build();
{% endhighlight %}

It's important to note that when specifying multiple fields during your query, the field will persist from the point it's used onwards until it's changed again. For example:

{% highlight csharp %}
var search = new RiakFluentSearch("people", "age")
    .Between(30, 35)
    .Or("name", "Bob")
    .Or("Alice")
    .Build();
{% endhighlight %}

The second `Or` in this query refers to the `name` field, not the `age` field that was declared during construction. To revert back to `age` it would have to be specified again:

{% highlight csharp %}
var search = new RiakFluentSearch("people", "age")
    .Between(30, 35)
    .Or("name", "Bob")
    .Or("age", 20)
    .Build();
{% endhighlight %}

### Grouping ###

The basic use of the fluent API doesn't cover cases where logical precedence is important. For example, what happens when you query like this:

{% highlight csharp %}
var search = new RiakFluentSearch("people", "name")
    .Search(Token.StartsWith("Jo"))
    .Or(Token.StartsWith("Al"))
    .AndBetween("age", 30, 35)
    .Build();
{% endhighlight %}

Did we mean `name:Jo* OR (name:Al* AND age:[30 TO 35])` or did we mean `(name:Jo* OR name:Al*) AND age:[30 TO 35]`? Instead of relying on precedence rules we can use the _Group_ functionality of the fluent API. This can be done as the first part of a new query using the `Group()` method on `RiakFluentSearch`, or can be used via the overloaded functions which expect expressions that do nested configuration of queries.

{% highlight csharp %}
var search = new RiakFluentSearch("people", "name")
    .Group(Token.StartsWith("Jo"),
        t => t.Or(Token.StartsWith("Al")))
    .AndBetween("age", 30, 35)
    .Build();
{% endhighlight %}

The syntax here is slightly unpleasant, but it should read as though your starting a group with the name starting with `Jo` and continuing the group with an `OR` check against the name starting with `Al`. The set up expression can be used just like the existing fluent query to produce more complicated queries and nested groups. For example:

{% highlight csharp %}
var search = new RiakFluentSearch("people", "name")
    .Group(Token.StartsWith("Jo"),
        t => t.Or(Token.StartsWith("Al")
            .And("origin", "Australia", x => x.Or("New Zealand").Boost(5))))
    .AndBetween("age", 30, 35,
        t => t.Or("status", "legend", x => t.And("loves", "erlang")))
    .Build();
{% endhighlight %}

This structure will result in people that match the following:

    (name:Jo* OR (name:Al* AND (origin:Australia OR origin:New\ Zealand^5))) AND
    (age:[30 TO 35] OR (status:legend AND loves:erlang))

The goal here is to save you the pain of worring about query syntax issues when talking to Riak Search, and to avoid you having to think about character escaping.

At this point we don't yet have the ability to pre-generate queries with variables that can be substituted, but this is a feature we intend to add in a future version.

Now that you know how to construct queries, let's take a look at how you invoke them and handle the results.

## Executing a Search ##

After reading the above section you now have a search ready to execute. There are two ways to execute this in Riak. One is via the Map/Reduce interface, the other is via the new PBC message that was introduced in Riak 1.2.

### Querying via Map/Reduce ###

Start by creating your search query:

{% highlight csharp %}
var search = new RiakFluentSearch("people", "name")
    .Search(Token.StartsWith("Jo"))
    .Build();
{% endhighlight %}

You would then add this to a new map/reduce query:

{% highlight csharp %}
var mr = new RiakMapReduceQuery()
    .Inputs(new RiakBucketSearchInput(search));
{% endhighlight %}

You can add phases as per any other map/reduce query. At this point you can invoke the map/reduce job on the `RiakClient`:

{% highlight csharp %}
var result = Client.MapReduce(req);
if (result.IsSuccess) ...;
{% endhighlight %}

Or you can use the streaming API:

{% highlight csharp %}
var result = Client.StreamMapMapReduce(req);
if (result.IsSuccess) ...;
{% endhighlight %}

Using this interface gives you the added benefit of being able to do other phases after searching prior to returning the data back to the client.

### Querying via PBC ###

As per usual you would start with your query generation:

{% highlight csharp %}
var search = new RiakFluentSearch("people", "name")
    .Search(Token.StartsWith("Jo"))
    .Build();
{% endhighlight %}

You would then add this to a new `RiakSearchRequest` instance:

{% highlight csharp %}
var req = new RiakSearchRequest { Query = search };
{% endhighlight %}

Then you can invoke the query on the `RiakClient`:

{% highlight csharp %}
var result = Client.Search(req);
if (result.IsSuccess) ...;
{% endhighlight %}

The new PBC interface returns a result that contains details on the set of documents that were returned along with the maximum score for the search. Each document in the result contains an identifier which identifies the object in the bucket, along with the other that the document contains.

## That's it! ##

The API is a little richer than what's just covered here. So fire it up and have a play with it!

  [SearchWiki]: http://docs.basho.com/riak/latest/tutorials/querying/Riak-Search/

