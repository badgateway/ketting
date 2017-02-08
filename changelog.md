ChangeLog
=========

0.1.0 (????-??-??)
------------------

* #7: Strip `_embedded` and `_links` from `Representation.body`. They are
  already available through `Representation.embedded` and
  `Representation.links`.
* Added a cache for resources in the Client object, which ensures that if you
  request the same resource twice, you'll end up with the same object.
* #6: Automatically parse `_embedded` and treat items in this object as real
  resources.
* Fixed a bug in `post()`.
* Allowing custom headers to be set, and allowing default headers to be
  overridden.
* Automatically resolve all urls from `links()`.


0.0.4 (2017-02-06)
-----------------

* Bugfixes.
* Linting with eslint.


0.0.3 (2017-02-06)
------------------

* Now using Bluebird for promises, so we can extend them.
* #2: Custom requests are now possible on `Resource` objects.
* #3: Promises returned from `follow()` now have a `follow()` function
  themselves, making it extremely easy to hop from link to link.
* Added a `post()` method for making new resources. This function returns a
  `Resource` object again if the response contained a `Location` header.
* #4: Things in the `_embedded` property are now also treated as links and can
  be followed.
* The `links()` method on Resource now have a `rel` argument for easy filtering.
* Added a `followAll()` function for getting collections.


0.0.2 (2017-01-03)
------------------

* `PUT` request.
* `DELETE` request.


0.0.1 (2016-12-28)
------------------

* First version!
* Parses HAL `_links`.
* Follows links.
* `GET` requests.
* `refresh()` function.
