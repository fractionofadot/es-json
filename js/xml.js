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
    obj = xml.nodeValue;
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
    this.responseXML !== null &&
    this.responseXML.getElementsByTagName('ImageServer')) {
    // success!
    var object = xmlToJson(this.responseXML);
    console.log(object);
    makeESObject(object);
 
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
  gallery.innerHTML = "";
  createClient(url);
  
}

function isArray(obj) {
  if (Object.prototype.toString.call(obj) === '[object Array]') {
    return obj;
  } else {
    return [obj];
  }
}

function findObjByAttr (obj, name, value) {
  if (Object.prototype.toString.call(obj) === '[object Array]') {
    for (var i = 0; i < obj.length; i++) {
      if (obj[i]['@attributes'][name] == value) {
        return obj[i];
      } 
    }
  } else {
    if (obj['@attributes'][name] == value) {
      return obj;
    } 
  }

  // console.log("Attributes:" + name + ", " + value + " not found in object:");
  // console.log(obj);
  return false;
}

function displayCatalogs(object) {

  hostname = object['ImageServer']['@attributes']['host'];
  var items = findObjByAttr(object['ImageServer']['Response']['ContentList'], "type", "catalog")['Item'];

  for (var i=0; i < items.length; i++) {
    var props = {};
    props.description = findObjByAttr(items[i]['Property'], "name", "Description")['#text'];
    props.name = (findObjByAttr(items[i]['Property'], "name", "Name") ? findObjByAttr(items[i]['Property'], "name", "Name")['#text'] : items[i]["@attributes"]["name"]);

    gallery.innerHTML += 
      '<div class="col-sm-6 col-md-4">' +
        '<div class="thumbnail">' +
          '<a href="javascript:openCatalog(\'' + items[i]['@attributes']['name'] + '\')"><img src="http://' + hostname + '/lizardtech/iserv/getthumb?thumbspec=gallery&cat=' + items[i]["@attributes"]["name"] + '" alt=""></a>' +
          '<div class="caption">' +
            '<h3>' + props.name + '</h3>' +
            '<p>' + props.description + '</p>' +
          '</div></div></div>';

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

function makeESObject(object) {
  var imageServer = {
    host: object['ImageServer']['@attributes']['host'],
    licensestate: object['ImageServer']['@attributes']['licensestate'],
    path: object['ImageServer']['@attributes']['path'],
    version: object['ImageServer']['@attributes']['version']
  };
  
  var command = object['ImageServer']['Request']['@attributes']['command'];
  
  var parameters = {};
  if (object['ImageServer']['Request']['Parameter']) {
   parameters = {
    cat: findObjByAttr(object['ImageServer']['Request']['Parameter'], "name", "cat")['#text'],
    item: findObjByAttr(object['ImageServer']['Request']['Parameter'], "name", "item")['#text'],
    style: findObjByAttr(object['ImageServer']['Request']['Parameter'], "name", "style")['#text'],
    props: findObjByAttr(object['ImageServer']['Request']['Parameter'], "name", "props")['#text'],
  };
  }

 console.log(imageServer.host);
  
}

function createClient(url) {
  var client = new XMLHttpRequest();
  client.onload = handler;
  client.open("GET", url);
  client.send();
  return client;
}

var url = "http://localhost/lizardtech/iserv/browse?";
var chromecast = "http://127.0.0.1:42677/es-json/browse.xml";
createClient(chromecast);

/*
ImageServer (host, licensestate, path, version, xmlns:LizardTech)
  Request (command)
    Parameter (name [cat, item, props, style, ...]) 
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
*/
