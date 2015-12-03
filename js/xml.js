var hostname = "sea-eng-demo:80";
var what = Object.prototype.toString;

function xmlToJson (xml) {
  var obj = {};

  if(xml.nodeType == 1) {
    if (xml.attributes.length > 0) {
      obj["@attributes"] = {};
      for (var j = 0; j < xml.attributes.length; j++) {
        var attribute = xml.attributes.item(j);
        obj["@attributes"][attribute.nodeName] = attribute.nodeValue;
      }
    }
  } else if (xml.nodeType == 3) {
    obj = xml.nodeValue
  }

  if (xml.hasChildNodes()) {
    for (var i = 0; i <xml.childNodes.length; i++) {
      var item = xml.childNodes.item(i);
      var nodeName = item.nodeName;
      if (typeof(obj[nodeName]) == "undefined") {
        obj[nodeName] = xmlToJson(item);
      } else {
        if (typeof(obj[nodeName].push) == "undefined") {
          var old = obj[nodeName];
          obj[nodeName] = [];
          obj[nodeName].push(old);
        }
        obj[nodeName].push(xmlToJson(item));
      }
    }
  }
  return obj;
}

function handler() {
  if(this.status == 200 &&
    this.responseXML != null &&
    this.responseXML.getElementsByTagName('ImageServer')) {
    // success!
    var object = xmlToJson(this.responseXML);
    console.log(object);
 
    if (object['ImageServer']['Request']['Parameter']) { 
      if (object['ImageServer']['Request']['Parameter']['@attributes']['name'] == "cat")  {
        displayImages(object); // in a catalog, display folders and images
      } else {
        displayCatalogs(object); // top level catalogs, default
      }  
    } else {
      displayCatalogs(object); // top level catalogs, default
    }
  } else {
    console.log("Something went wrong. Status: " + this.status + ", responseXML: " + this.responseXML + ", url: " + url);
  }
}

function openCatalog(catalog) {
  var url = "http://" + hostname + "/lizardtech/iserv/browse?cat=" + catalog;
  createClient(url);
  
}

function isArray(obj) {
  if (! obj.length) {
    var newArray = [obj];
    return newArray;
  } else {
    return obj;
  }
}

function findItemByAttr (obj, name, value) {
  if (obj.length > 0) {
    for (i = 0; i < obj.length; i++) {
      if (obj[i]['@attributes'][name] == value) {
        console.log("match array");
        return obj[i];
      } 
    }
  } else {
    if (obj['@attributes'][name] == value) {
      console.log("match single");
      return obj;
    } 
  }

  console.log("Got here");
  return false;
}

function displayCatalogs(object) {

  hostname = object['ImageServer']['@attributes']['host'];
  var items = findItemByAttr(object['ImageServer']['Response']['ContentList'], "type", "catalog")['Item'];
  

  for (i=0; i < items.length; i++) {
    console.log(items[i]['Property']);
    //var description = findItemByAttr(items[i]['Property'], "name", "Description")['#text'];
   // gallery.innerHTML += '<a href="javascript:openCatalog(\'' + items[i]['@attributes']['name'] + '\')"><img width="300" height="300" src="http://' + hostname + '/lizardtech/iserv/getthumb?thumbspec=gallery&cat=' + items[i]['@attributes']['name'] + '"/></a>';
    gallery.innerHTML += '<div class="row">' +
      '<div class="col-sm-6 col-md-4">' +
        '<div class="thumbnail">' +
          '<img src="http://' + hostname + '/lizardtech/iserv/getthumb?thumbspec=gallery&cat=' + items[i]["@attributes"]["name"] + '" alt="">' +
          '<div class="caption">' +
            '<h3>' +  + '</h3>' +
            '<p>' +  + '</p>' +
          '</div></div></div></div>';

  }

}

function displayImages(object) {
  var hostname = object['ImageServer']['@attributes']['host'];
  var contentList = object['ImageServer']['Response']['Catalog']['Folder']['ContentList'];
  var folder = object['ImageServer']['Response']['Catalog']['Folder']['@attributes']['name'];
  var catalog = {};
  catalog.properties = object['ImageServer']['Response']['Catalog']['Property'];

  if (catalog.properties.length) {
    for (i = 0; i < catalog.properties.length; i++) {
      if (catalog.properties[i]['@attributes']['name'] == "Name") {
        catalog.properties.name = catalog.properties[i]['#text'];
      } else if (catalog.properties[i]['@attributes']['name'] == "Description") {
        catalog.properties.description = catalog.properties[i]['#text'];
      }
    }
  } else {
    catalog.properties.name = object['ImageServer']['Response']['Catalog']['@attributes']["name"];
    catalog.properties.description = catalog.properties['#text'];
  }

  gallery.innerHTML += "<h2>" + catalog.properties.name + "</h2>" + "<p>" + catalog.properties.description + "</p>";
  
  if (contentList['@attributes']['type'] == "image") {
    if (contentList['Item'].length) {
      //an array of items
    } else {
      //a single item
      var id = contentList['Item']['@attributes']['id'];
      var name = contentList['Item']['@attributes']['name'];
      var georgn = contentList['Item']['@attributes']['georgn'];
      var srs = contentList['Item']['@attributes']['srs'];
    }
  }
}

function createClient(url) {
  var client = new XMLHttpRequest();
  client.onload = handler;
  client.open("GET", url);
  client.send();
  return client;
}

var url = "http://localhost/lizardtech/iserv/browse?";
createClient(url);

/*
ImageServer (host, licensestate, path, version, xmlns:LizardTech)
  Request (command)
    Parameter (name [cat]) 
  Response
    Status (code)
    ContentList (type[image,style,catalog])
      Item (georgn, name, srs)
        Property (name)
    Catalog (name)
      Property (name)
      Image (bitspersample, colorspace, ctime, georgn, height, mtime, name, numlevels, parent, samplesperpixel, size, type, width)
        Property (name)
      Folder (name)
        ContentList (type)
          Item (georgn, id, name, srs, jpip)
            Property (name)
    Property (name)
    Folder (name, parent)
      ContentList (type)
        Item (georgn, id, name, jpip, srs)
          Property (name)
*/
