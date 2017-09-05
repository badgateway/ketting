module.exports = {

  /**
   * Resolves a relative url using another url.
   *
   * @param {string} base - Base URI
   * @param {string} relative - URI to resolve
   * @returns {string}
   */
  resolve: function(base, relative) {

    // If the URL object is supported, we prefer that.
    if (typeof URL !== "undefined") {
      return (new URL(relative, base).toString());
    }

    // Code taken from this gist:;
    // https://gist.github.com/johan/3915545#file-resolveurl-js

    var doc      = document
      , old_base = doc.getElementsByTagName('base')[0]
      , old_href = old_base && old_base.href
      , doc_head = doc.head || doc.getElementsByTagName('head')[0]
      , our_base = old_base || doc_head.appendChild(doc.createElement('base'))
      , resolver = doc.createElement('a')
      , resolved_url
    ;
    our_base.href = base;
    resolver.href = relative;
    resolved_url  = resolver.href; // browser magic at work here

    if (old_base) {
      old_base.href = old_href;
    } else {
      doc_head.removeChild(our_base);
    }
    return resolved_url;

  }

};
