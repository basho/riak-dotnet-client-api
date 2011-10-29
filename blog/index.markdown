---
layout: default
title: CorrugatedIron Blog
heading: <strong>CorrugatedIron</strong> Blog
subheading: Random thoughts, design decisions and general discussion
menuitem: Blog
---

<div class="posts">
<div style="text-align: right"><a href="/blog/atom.xml" title="ATOM Feed">ATOM Feed</a></div>
<ul>
{% for post in site.posts %}
<li><div class="post-link"><a href="{{ post.url }}">"{{ post.title }}"</a><small> by {{ post.author }}</small></div>
<div class="post-date"><span>{{ post.date | date_to_string }}</span></div><br/>
<small>{{ post.description }}</small></li>
{% endfor %}
</ul>
</div>
