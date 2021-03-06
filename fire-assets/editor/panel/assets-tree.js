﻿
var Path = require('fire-path');
var Url = require('fire-url');

function _isTexture(extname) {
  return extname === '.png' || extname === '.jpg';
}

function _newAssetsItem(url, type, id, parentEL) {
  var newEL = new AssetsItem();
  newEL.isRoot = type === 'root';
  newEL.isFolder = (type === 'folder' || newEL.isRoot);
  newEL.isSubAsset = !parentEL.isFolder;

  var extname = "";
  var basename = Url.basename(url);

  if (!newEL.isFolder) {
    extname = Url.extname(url);
    basename = Url.basename(url, extname);
  }

  var img;

  newEL.extname = extname;
  type = type || extname.toLowerCase();
  switch (type) {
    case 'root':
      newEL.setIcon('db');
      break;

    case 'folder':
      newEL.setIcon('folder');
      break;

    case '.fire':
      newEL.setIcon('fire');
      break;

    case '.js':
      newEL.setIcon('js');
      break;

    case '.coffee':
      newEL.setIcon('co');
      break;

    case '.ts':
      newEL.setIcon('ts');
      break;

    case '.txt':
      newEL.setIcon('txt');
      break;

    case '.html':
    case '.htm':
    case '.xml':
    case '.json':
      newEL.setIcon('html');
      break;

    case '.css':
    case '.less':
    case '.styl':
      newEL.setIcon('css');
      break;

    case '.anim':
      newEL.setIcon('anim');
      break;

    case '.sprite':
      newEL.setIcon('sprite');
      break;

    case '.fnt':
    case '.bmf':
    case '.bmfont':
      newEL.setIcon('bmfont');
      break;

    case '.atlas':
      newEL.setIcon('atlas');
      break;

    case '.mp3':
    case '.wav':
    case '.ogg':
      newEL.setIcon('audio');
      break;

    case '.png':
    case '.jpg':
      img = new Image();
      img.src = 'uuid://' + id + "?thumb";
      newEL.setIcon(img);
      break;

    case '.asset':
      newEL.setIcon('fa fa-cube');
      break;

    default:
      newEL.setIcon('fa fa-question-circle');
      break;
  }

  this.initItem(newEL, basename, id, parentEL);
  return newEL;
}

function _getNameCollisions(target, list) {

  var nodes = target.childNodes;

  var nodesLen = nodes.length;
  var len = list.length;
  var i, j;
  var name;
  var node;
  var collisions = [];

  for (i = 0; i < len; i++) {
    name = list[i];

    for (j = 0; j < nodesLen; j++) {

      node = nodes[j];
      if (node.name + node.extname === name) {
        collisions.push(node);
      }

    }
  }

  return collisions;
}

function _addCustomAssetMenu(target, template) {
  function findMenu(menuArray, label) {
    for (var i = 0; i < menuArray.length; i++) {
      if (menuArray[i].label === label) {
        return menuArray[i];
      }
    }
    return null;
  }

  function onclick(item, fileName) {
    var contextSelection = Editor.Selection.contextAssets;
    if (contextSelection.length > 0) {
      var targetEL = target.idToItem[contextSelection[0]];
      if (!targetEL.isFolder) {
        targetEL = targetEL.parentElement;
      }
      var url = target.getUrl(targetEL);
      var newAsset = new item.customAsset();
      var newAssetUrl = Url.join(url, fileName + '.asset');
      Editor.AssetDB.generateUniqueUrl(newAssetUrl, function(uniqueUrl) {
        target._focusUrl = uniqueUrl;
        Editor.AssetDB.save(uniqueUrl, Editor.serialize(newAsset));
      }.bind(target));
    }
  }

  // Custom Asset Menu Item
  var items = Fire._customAssetMenuItems;
  for (var i = 0; i < items.length; i++) {
    var item = items[i];
    var subPathes = item.menuPath.split('/');
    var fileName = subPathes.length > 0 ? subPathes[subPathes.length - 1] : subPathes[0];
    if (fileName === "") {
      Fire.error('Invalid custom asset menu path: ' + item.menuPath);
      continue;
    }
    //var priority = item.priority || 0;

    // enumerate menu path
    var newMenu = null;
    for (var p = 0, parent = template; p < subPathes.length; p++) {
      var label = subPathes[p];
      if (!label) {
        continue;
      }
      var parentMenuArray = parent === template ? template : parent.submenu;
      var menu;
      if (parentMenuArray) {
        if (parentMenuArray.length > 0) {
          menu = findMenu(parentMenuArray, label);
        }
        if (menu) {
          if (menu.submenu) {
            parent = menu;
            continue;
          } else {
            Fire.error('Custom Asset menu path %s conflict', item.menuPath);
            break;
          }
        }
      }
      // create
      newMenu = {
        label: label,
      };
      if (!parentMenuArray) {
        parent.submenu = [newMenu];
      } else {
        //parentMenuArray.splice(3, 0, newMenu);
        parentMenuArray.push(newMenu);
      }
      parent = newMenu;
    }
    if (newMenu && !newMenu.submenu) {
      newMenu.click = onclick.bind(this, item, fileName);
    } else {
      Fire.error('Invalid custom asset menu path: ' + item.menuPath);
    }
  }
}


Polymer({
  created: function() {
    this.super();

    this.contextmenu = null;

    // dragging
    this.curDragoverEL = null;
    this.lastDragoverEL = null;
    this.dragenterCnt = 0;

    // confliction
    this.confliction = [];

    this._focusUrl = null;
  },

  ready: function() {
    this.super();

    this.addEventListener("dragenter", function(event) {
      ++this.dragenterCnt;
    }, true);

    this.addEventListener("dragleave", function(event) {
      --this.dragenterCnt;
      if (this.dragenterCnt === 0) {
        this.resetDragState();
      }
    }, true);
  },

  getCreateMenuTemplate: function() {
    return [
      // New Folder
      {
        label: 'New Folder',
        click: function() {
          var url = "assets://";
          var contextSelection = Editor.Selection.contextAssets;
          if (contextSelection.length > 0) {
            var targetEL = this.idToItem[contextSelection[0]];
            if (!targetEL.isFolder)
              targetEL = targetEL.parentElement;
            url = this.getUrl(targetEL);
          }

          var newAssetUrl = Url.join(url, 'New Folder');
          Editor.AssetDB.generateUniqueUrl(newAssetUrl, function(uniqueUrl) {
            this._focusUrl = uniqueUrl;
            Editor.AssetDB.newFolder(uniqueUrl);
          }.bind(this));
        }.bind(this)
      },

      {
        type: 'separator'
      },

      // New Script
      {
        label: 'New Script',
        click: function() {
          var url = "assets://";
          var contextSelection = Editor.Selection.contextAssets;
          if (contextSelection.length > 0) {
            var targetEL = this.idToItem[contextSelection[0]];
            if (!targetEL.isFolder)
              targetEL = targetEL.parentElement;
            url = this.getUrl(targetEL);
          }

          var newAssetUrl = Url.join(url, 'NewComponent.js');
          Editor.AssetDB.generateUniqueUrl(newAssetUrl, function(uniqueUrl) {
            this._focusUrl = uniqueUrl;
            Editor.AssetDB.newScript(uniqueUrl, "simple-component");
          }.bind(this));
        }.bind(this)
      },

      {
        type: 'separator'
      },

      // New Scene
      {
        label: 'New Scene',
        click: function() {
          var url = "assets://";
          var contextSelection = Editor.Selection.contextAssets;
          if (contextSelection.length > 0) {
            var targetEL = this.idToItem[contextSelection[0]];
            if (!targetEL.isFolder)
              targetEL = targetEL.parentElement;
            url = this.getUrl(targetEL);
          }

          var newAsset = new Fire._Scene();
          var camera = newAsset.addEntity('Main Camera');
          camera.addComponent(Fire.Camera);

          var newAssetUrl = Url.join(url, 'New Scene.fire');
          Editor.AssetDB.generateUniqueUrl(newAssetUrl, function(uniqueUrl) {
            this._focusUrl = uniqueUrl;
            Editor.AssetDB.save(uniqueUrl, Editor.serialize(newAsset));
          }.bind(this));
        }.bind(this)
      },

      // New Atlas
      {
        label: 'New Atlas',
        click: function() {
          var url = "assets://";
          var contextSelection = Editor.Selection.contextAssets;
          if (contextSelection.length > 0) {
            var targetEL = this.idToItem[contextSelection[0]];
            if (!targetEL.isFolder)
              targetEL = targetEL.parentElement;
            url = this.getUrl(targetEL);
          }

          var newAsset = new Fire.Atlas();
          var newAssetUrl = Url.join(url, 'New Atlas.atlas');
          Editor.AssetDB.generateUniqueUrl(newAssetUrl, function(uniqueUrl) {
            this._focusUrl = uniqueUrl;
            Editor.AssetDB.save(uniqueUrl, Editor.serialize(newAsset));
          }.bind(this));
        }.bind(this)
      },

      // New Sprite (Standalone)
      {
        label: 'New Sprite (Standalone)',
        visible: Editor.isDev,
        click: function() {
          var targetEL = null;
          var contextSelection = Editor.Selection.contextAssets;
          if (contextSelection.length > 0) {
            targetEL = this.idToItem[contextSelection[0]];
          }

          if (targetEL && _isTexture(targetEL.extname)) {
            var textureName = targetEL.name;

            Fire.AssetLibrary.loadAssetInEditor(targetEL.userId, function(error, asset) {
              var newAsset = new Fire.Sprite();
              newAsset.texture = asset;
              newAsset.width = asset.width;
              newAsset.height = asset.height;

              var url = this.getUrl(targetEL.parentElement);
              var newAssetUrl = Url.join(url, textureName + '.sprite');
              Editor.AssetDB.generateUniqueUrl(newAssetUrl, function(uniqueUrl) {
                this._focusUrl = uniqueUrl;
                Editor.AssetDB.save(uniqueUrl, Editor.serialize(newAsset));
              }.bind(this));
            }.bind(this));
          } else {
            Fire.warn("Can not create sprite from non-texture element, please select a texture first.");
          }
        }.bind(this)
      },

      {
        type: 'separator'
      },

      // New Animation Clip
      {
        label: 'New Animation Clip',
        click: function() {
          var url = "assets://";
          var contextSelection = Editor.Selection.contextAssets;
          if (contextSelection.length > 0) {
            var targetEL = this.idToItem[contextSelection[0]];
            if (!targetEL.isFolder)
              targetEL = targetEL.parentElement;
            url = this.getUrl(targetEL);
          }

          var newAsset = new Fire.AnimationClip();
          var newAssetUrl = Url.join(url, 'New AnimationClip.anim');
          Editor.AssetDB.generateUniqueUrl(newAssetUrl, function(uniqueUrl) {
            this._focusUrl = uniqueUrl;
            Editor.AssetDB.save(uniqueUrl, Editor.serialize(newAsset));
          }.bind(this));
        }.bind(this)
      },

      {
        label: 'New Spine Skeleton Data',
        click: function() {
          var targetEL = null;
          var contextSelection = Editor.Selection.contextAssets;
          if (contextSelection.length > 0) {
            targetEL = this.idToItem[contextSelection[0]];
            if (targetEL && targetEL.extname === '.json') {
              var url = this.getUrl(targetEL);
              var uuid = targetEL.userId;
              var scope = this;
              Fire.Spine.SkeletonDataAsset.import(url, uuid, function(newAsset, destUrl) {
                Editor.AssetDB.generateUniqueUrl(destUrl, function(uniqueUrl) {
                  Editor.AssetDB.save(uniqueUrl, Editor.serialize(newAsset));
                  scope._focusUrl = uniqueUrl;
                });
              });
              return;
            }
          }
          Fire.warn("Can not create Spine.SkeletonDataAsset from non-json element, please select a json first.");
        }.bind(this)
      },

      {
        label: 'New Spine Atlas Data',
        click: function() {
          var targetEL = null;
          var contextSelection = Editor.Selection.contextAssets;
          if (contextSelection.length > 0) {
            targetEL = this.idToItem[contextSelection[0]];
            if (targetEL && targetEL.extname === '.txt') {
              var url = this.getUrl(targetEL);
              var uuid = targetEL.userId;
              var scope = this;
              Fire.Spine.AtlasAsset.import(url, uuid, function(newAsset, destUrl) {
                Editor.AssetDB.generateUniqueUrl(destUrl, function(uniqueUrl) {
                  Editor.AssetDB.save(uniqueUrl, Editor.serialize(newAsset));
                  scope._focusUrl = uniqueUrl;
                });
              });
              return;
            }
          }
          Fire.warn("Can not create Spine.AtlasAsset from non-atlas element, please select a atlas first.");
        }.bind(this)
      }, {
        label: 'Instantiate Particle In Scene',
        click: function() {
          var targetEL = null;
          var contextSelection = Editor.Selection.contextAssets;
          if (contextSelection.length > 0) {
            targetEL = this.idToItem[contextSelection[0]];
            if (targetEL && targetEL.extname === '.plist') {
              var fs = require('fire-fs');
              var Plist = require('plist');
              var url = this.getUrl(targetEL);
              var uuid = targetEL.userId;
              var path = Editor.AssetDB._fspath(Editor.AssetDB.uuidToUrl(uuid));
              var plistStr = fs.readFileSync(path, 'utf8');
              var pConfig = Plist.parse(plistStr);
              var scope = this;
              // console.log(Object.keys(targetEL));
              var entity = new Fire.Entity(targetEL.name);
              var ps = entity.addComponent('Fire.ParticleSystem');
              var urlArr = url.split('/');
              urlArr[urlArr.length - 1] = pConfig.textureFileName;
              var spriteName = pConfig.textureFileName.split('.')[0];
              var imageUrl = urlArr.join('/') + '/' + spriteName + '.sprite';
              var imageUuid = Editor.AssetDB.urlToUuid(imageUrl);
              Fire.AssetLibrary.loadAssetInEditor(imageUuid, function (error, rawAsset) {
                  if (error) {
                      Fire.error(error);
                      return;
                  } else {
                      ps.baseSprite = rawAsset;
                      Fire.AssetLibrary.cacheAsset(rawAsset);
                  }
              });
              ps.angle = pConfig.angle;
              ps.angleVar = pConfig.angleVariance;
              ps.baseSprite = pConfig.textureFileName;
              if (pConfig.duration === -1) {
                ps.loop = true;
              }
              else{
                ps.duration = pConfig.duration;
                ps.loop = false;
              }
              ps.emitterMode = pConfig.emitterType;
              ps.endColor = Fire.color(pConfig.finishColorRed, pConfig.finishColorGreen, pConfig.finishColorBlue, pConfig.finishColorAlpha);
              ps.endColorVar = Fire.color(pConfig.finishColorVarianceRed, pConfig.finishColorVarianceGreen, pConfig.finishColorVarianceBlue, pConfig.finishColorVarianceAlpha);
              ps.endRadius = pConfig.maxRadius;
              ps.endRadiusVar = pConfig.maxRadiusVariance;
              ps.endSize = pConfig.finishParticleSize;
              ps.endSizeVar = pConfig.finishParticleSizeVariance;
              ps.endSpin = pConfig.rotationEnd;
              ps.endSpinVar = pConfig.rotationEndVariance;
              ps.gravity = Fire.v2(pConfig.gravityx, pConfig.gravityy);
              ps.life = pConfig.particleLifespan;
              ps.lifeVar = pConfig.particleLifespanVariance;
              ps.radialAccel = pConfig.radialAcceleration;
              ps.radialAccelVar = pConfig.radialAccelVariance;
              ps.rotatePerSecond = pConfig.rotatePerSecond;
              ps.rotatePerSecondVar = pConfig.rotatePerSecondVariance;
              ps.speed = pConfig.speed;
              ps.speedVar = pConfig.speedVariance;
              ps.startColor = Fire.color(pConfig.startColorRed, pConfig.startColorGreen, pConfig.startColorBlue, pConfig.startColorAlpha);
              ps.startColorVar = Fire.color(pConfig.startColorVarianceRed, pConfig.startColorVarianceGreen, pConfig.startColorVarianceBlue, pConfig.startColorVarianceAlpha);
              ps.startRadius = pConfig.minRadius;
              // ps.startRadiusVar = pConfig.minRadiusVariance;
              ps.startSize = pConfig.startParticleSize;
              ps.startSizeVar = pConfig.startParticleSizeVariance;
              ps.startSpin = pConfig.rotationStart;
              ps.startSpinVar = pConfig.rotationStartVariance;
              // ps.positionType = pConfig.positionType;
              ps.positionVar = Fire.v2(pConfig.sourcePositionVariancex, pConfig.sourcePositionVariancey);
              ps.tangentialAccel = pConfig.tangentialAcceleration;
              ps.tangentialAccelVar = pConfig.tangentialAccelVariance;
              ps.maxParticles = pConfig.maxParticles;
              ps.calculateEmissionRate();
            } else {
              Fire.warn("Can not instantiate Particle System without a plist data file.");
            }
          } else {
            Fire.warn("Can not create Spine.AtlasAsset from non-atlas element, please select a atlas first.");
          }
        }.bind(this)
      },

      {
        type: 'separator'
      },
    ];
  },

  createContextMenu: function() {
    var template = [
      // Create
      {
        label: 'Create',
        submenu: this.getCreateMenuTemplate(),
      },

      // =====================
      {
        type: 'separator'
      },

      // Rename
      {
        label: 'Rename',
        click: function() {
          var contextSelection = Editor.Selection.contextAssets;
          if (contextSelection.length > 0) {
            var targetEL = this.idToItem[contextSelection[0]];
            this.rename(targetEL);
          }
        }.bind(this),
      },

      // Delete
      {
        label: 'Delete',
        click: function() {
          var contextSelection = Editor.Selection.contextAssets;
          var elements = this.getToplevelElements(contextSelection);
          for (var i = 0; i < elements.length; i++) {
            Editor.AssetDB.delete(this.getUrl(elements[i]));
          }
        }.bind(this),
      },

      // Reimport
      {
        label: 'Reimport',
        click: function() {
          var contextSelection = Editor.Selection.contextAssets;
          if (contextSelection.length > 0) {
            var selectedItemEl = this.idToItem[contextSelection[0]];
            var url = this.getUrl(selectedItemEl);

            // remove childnodes
            if (selectedItemEl.isFolder) {
              while (selectedItemEl.firstChild) {
                selectedItemEl.removeChild(selectedItemEl.firstChild);
              }
              selectedItemEl.foldable = false;
            }
            Editor.AssetDB.reimport(url);
          }
        }.bind(this)
      },

      // =====================
      {
        type: 'separator'
      },

      // Show in finder
      {
        label: 'Show in ' + (Fire.isWin32 ? 'Explorer' : 'Finder'),
        click: function() {
          var contextSelection = Editor.Selection.contextAssets;
          if (contextSelection.length > 0) {
            var targetEL = this.idToItem[contextSelection[0]];
            Editor.AssetDB.explore(this.getUrl(targetEL));
          }
        }.bind(this)
      },

      // Show in library
      {
        label: 'Show in Library',
        visible: Editor.isDev,
        click: function() {
          var contextSelection = Editor.Selection.contextAssets;
          if (contextSelection.length > 0) {
            var targetEL = this.idToItem[contextSelection[0]];
            Editor.AssetDB.exploreLib(this.getUrl(targetEL));
          }
        }.bind(this)
      },

      // Print uuid
      {
        label: 'Show Uuid',
        visible: Editor.isDev,
        click: function() {
          var contextSelection = Editor.Selection.contextAssets;
          for (var i = 0; i < contextSelection.length; ++i) {
            var targetEL = this.idToItem[contextSelection[i]];
            Fire.log(targetEL.userId);
          }
        }.bind(this)
      },
    ];

    var create = template[0].submenu;
    _addCustomAssetMenu(this, create);

    var Remote = require('remote');
    var Menu = Remote.require('menu');

    this.contextmenu = Menu.buildFromTemplate(template);
  },

  browse: function(url) {
    var rootEL = _newAssetsItem.call(this, url, 'root', Editor.UUID.AssetsRoot, this);
    rootEL.folded = false;

    Editor.AssetDB.deepQuery(url, function(results) {
      for (var i = 0; i < results.length; ++i) {
        var info = results[i];
        this.newItem(info.url, info.uuid, info.parentUuid, info.isDir);
      }
      this.fire('restore-collapses');
    }.bind(this));
  },

  newItem: function(url, id, parentId, isDirectory) {
    var parentEL = this.idToItem[parentId];
    if (!parentEL) {
      Fire.warn('Can not find element for ' + parentId + " when import " + url);
      return;
    }
    var type = isDirectory ? 'folder' : '';
    var newEL = _newAssetsItem.call(this, url, type, id, parentEL);

    if (this._focusUrl === url) {
      this._focusUrl = null;
      this.expand(newEL.userId, true);
      this.scrollToItem(newEL);
      Editor.Selection.selectAsset(newEL.userId, true, true);
    }
  },

  moveItem: function(id, destUrl, destDirId) {
    var srcEL = this.idToItem[id];
    if (!srcEL) {
      Fire.warn('Can not find source element: ' + id);
      return;
    }

    // rename it first
    var destExtname = Path.extname(destUrl);
    var destBasename = Path.basename(destUrl, destExtname);
    srcEL.extname = destExtname;
    srcEL.name = destBasename;

    // insert it
    this.setItemParentById(id, destDirId);

    // expand parent
    var parentEL = this.idToItem[destDirId];
    if (parentEL.isFolder) {
      parentEL.folded = false;
    }
  },

  deleteSelection: function() {
    var elements = this.getToplevelElements(Editor.Selection.assets);
    for (var i = 0; i < elements.length; i++) {
      Editor.AssetDB.delete(this.getUrl(elements[i]));
    }
  },

  getUrl: function(element) {
    if (element.isRoot) {
      return element.name + "://";
    }

    var url = element.name + element.extname;
    var parentEL = element.parentElement;
    while (parentEL instanceof AssetsItem) {
      if (parentEL.isRoot) {
        url = parentEL.name + "://" + url;
        break;
      } else {
        url = Url.join(parentEL.name + parentEL.extname, url);
        parentEL = parentEL.parentElement;
      }
    }
    return url;
  },

  highlightBorder: function(item) {
    if (item && item instanceof AssetsItem) {
      var style = this.$.highlightBorder.style;
      style.display = "block";
      style.left = (item.offsetLeft - 2) + "px";
      style.top = (item.offsetTop - 1) + "px";
      style.width = (item.offsetWidth + 4) + "px";
      style.height = (item.offsetHeight + 3) + "px";

      item.highlighted = true;
    }
  },

  highlightInsert: function(item, parentEL, position) {
    var style = this.$.insertLine.style;
    if (item === this) {
      item = this.firstChild;
    }

    if (item === parentEL) {
      style.display = "none";
    } else if (item && parentEL) {
      style.display = "block";
      style.left = parentEL.offsetLeft + "px";
      if (position === 'before')
        style.top = (item.offsetTop) + "px";
      else
        style.top = (item.offsetTop + item.offsetHeight) + "px";
      style.width = parentEL.offsetWidth + "px";
      style.height = "0px";
    }
  },

  highlightConflicts: function(items) {
    for (var i = 0; i < items.length; ++i) {
      var item = items[i];
      if (item.conflicted === false) {
        item.conflicted = true;
        this.confliction.push(item);
      }
    }

    if (this.curDragoverEL) {
      this.curDragoverEL.invalid = true;
    }

    this.$.highlightBorder.setAttribute('invalid', '');
  },

  cancelHighligting: function() {
    if (this.curDragoverEL) {
      this.curDragoverEL.highlighted = false;
      this.$.highlightBorder.style.display = "none";
      this.$.insertLine.style.display = "none";
    }
  },

  cancelConflictsHighliting: function() {
    for (var i = 0; i < this.confliction.length; ++i) {
      this.confliction[i].conflicted = false;
    }
    this.confliction = [];
    if (this.curDragoverEL) {
      this.curDragoverEL.invalid = false;
      this.$.highlightBorder.removeAttribute('invalid');
    }
  },

  resetDragState: function() {
    this.cancelHighligting();
    this.cancelConflictsHighliting();

    this.curDragoverEL = null;
    this.lastDragoverEL = null;
    this.dragenterCnt = 0;
  },

  moveAssets: function(targetEL, assets) {
    var elements = this.getToplevelElements(assets);
    var targetUrl = this.getUrl(targetEL);

    for (var i = 0; i < elements.length; ++i) {
      var el = elements[i];

      // do nothing if we already here
      if (el === targetEL || el.parentElement === targetEL)
        continue;

      if (el.contains(targetEL) === false) {
        var srcUrl = this.getUrl(el);
        var destUrl = Url.join(targetUrl, el.name + el.extname);
        Editor.AssetDB.move(srcUrl, destUrl);
      }
    }
  },

  select: function(element) {
    Editor.Selection.selectAsset(element.userId, true, true);
  },

  clearSelect: function() {
    Editor.Selection.clearAsset();
    this.activeElement = null;
    this.shiftStartElement = null;
  },

  selectingAction: function(event) {
    event.stopPropagation();
    this.focus();

    var shiftStartEL = this.shiftStartElement;
    this.shiftStartElement = null;

    if (event.detail.shift) {
      if (shiftStartEL === null) {
        shiftStartEL = this.activeElement;
      }

      this.shiftStartElement = shiftStartEL;

      var el = this.shiftStartElement;
      var userIds = [];

      if (shiftStartEL !== event.target) {
        if (this.shiftStartElement.offsetTop < event.target.offsetTop) {
          while (el !== event.target) {
            userIds.push(el.userId);
            el = this.nextItem(el);
          }
        } else {
          while (el !== event.target) {
            userIds.push(el.userId);
            el = this.prevItem(el);
          }
        }
      }
      userIds.push(event.target.userId);
      Editor.Selection.selectAsset(userIds, true, false);
    } else if (event.detail.toggle) {
      if (event.target.selected) {
        Editor.Selection.unselectAsset(event.target.userId, false);
      } else {
        Editor.Selection.selectAsset(event.target.userId, false, false);
      }
    } else {
      // if target already selected, do not unselect others
      if (!event.target.selected) {
        Editor.Selection.selectAsset(event.target.userId, true, false);
      }
    }
  },

  selectAction: function(event) {
    event.stopPropagation();

    if (event.detail.shift) {
      Editor.Selection.confirm();
    } else if (event.detail.toggle) {
      Editor.Selection.confirm();
    } else {
      Editor.Selection.selectAsset(event.target.userId, true);
    }
  },

  renameConfirmAction: function(event) {
    event.stopPropagation();

    var renamingEL = this.$.nameInput.renamingEL;

    this.$.nameInput.style.display = 'none';
    this.$.content.appendChild(this.$.nameInput);
    this.$.nameInput.renamingEL = null;

    // NOTE: the rename confirm will invoke focusoutAction
    window.requestAnimationFrame(function() {
      this.focus();
    }.bind(this));

    renamingEL._renaming = false;

    if (renamingEL.name !== event.target.value) {
      var srcUrl = this.getUrl(renamingEL);
      var destUrl = Url.join(Url.dirname(srcUrl), event.target.value + renamingEL.extname);

      if (srcUrl.toLowerCase() === destUrl.toLowerCase()) {
        Fire.warn('Renaming asset from lower case to upper case or vice verse will not be detected by Git.');
      }

      Editor.AssetDB.move(srcUrl, destUrl);
    }
  },

  openAction: function(event) {
    event.stopPropagation();

    if (!(event.target instanceof AssetsItem)) {
      return;
    }

    Editor.sendToAll('asset:open', {
      uuid: event.target.userId,
      url: this.getUrl(event.target)
    });
  },

  contextmenuAction: function(event) {
    event.preventDefault();
    event.stopPropagation();

    // NOTE: without this, we will create new assets while watching ON
    var Remote = require('remote');
    Remote.getCurrentWindow().focus();

    //
    this.resetDragState();

    //
    var curContextID = Editor.UUID.AssetsRoot;
    if (event.target instanceof AssetsItem) {
      curContextID = event.target.userId;
    }

    Editor.Selection.setContextAsset(curContextID);

    if (!this.contextmenu) {
      this.createContextMenu();
    }

    this.contextmenu.popup(Remote.getCurrentWindow());
  },

  keydownAction: function(event) {
    this.super([event]);
    if (event.cancelBubble) {
      return;
    }

    switch (event.which) {
      // delete (Windows)
      case 46:
        this.deleteSelection();
        event.stopPropagation();
        break;

        // command + delete (Mac)
      case 8:
        if (event.metaKey) {
          this.deleteSelection();
        }
        event.stopPropagation();
        break;
    }
  },

  dragstartAction: function(event) {
    event.stopPropagation();

    EditorUI.DragDrop.start(event.dataTransfer, 'copyMove', 'asset', Editor.Selection.assets.map(function(item) {
      var uuid = item;
      var itemEL = this.idToItem[uuid];
      return {
        name: itemEL.name,
        id: item
      };
    }.bind(this)));
  },

  dragendAction: function(event) {
    EditorUI.DragDrop.end();

    this.resetDragState();
    Editor.Selection.cancel();
  },

  dragoverAction: function(event) {
    var dragType = EditorUI.DragDrop.type(event.dataTransfer);
    if (dragType !== "file" && dragType !== "asset") {
      EditorUI.DragDrop.allowDrop(event.dataTransfer, false);
      return;
    }

    //
    event.preventDefault();
    event.stopPropagation();

    //
    if (event.target) {
      this.lastDragoverEL = this.curDragoverEL;
      var dragoverTraget = event.target;
      if (event.target.isFolder === false)
        dragoverTraget = event.target.parentElement;

      if (event.target === this) {
        dragoverTraget = this.firstChild;
      }

      //
      if (dragoverTraget !== this.lastDragoverEL) {
        this.cancelHighligting();
        this.cancelConflictsHighliting();
        this.curDragoverEL = dragoverTraget;

        this.highlightBorder(dragoverTraget);

        // name collision check
        var names = [];
        var i = 0;
        var dragItems = EditorUI.DragDrop.items(event.dataTransfer);

        if (dragType === "file") {
          for (i = 0; i < dragItems.length; i++) {
            names.push(Path.basename(dragItems[i]));
          }
        } else if (dragType === "asset") {
          var srcELs = this.getToplevelElements(dragItems);
          for (i = 0; i < srcELs.length; i++) {
            var srcEL = srcELs[i];
            if (dragoverTraget !== srcEL.parentElement) {
              names.push(srcEL.name + srcEL.extname);
            }
          }
        }

        // check if we have conflicts names
        var valid = true;
        if (names.length > 0) {
          var collisions = _getNameCollisions(dragoverTraget, names);
          if (collisions.length > 0) {
            this.highlightConflicts(collisions);
            valid = false;
          }
        }
        EditorUI.DragDrop.allowDrop(event.dataTransfer, valid);
      }

      // highlight insert
      var bounding = this.getBoundingClientRect();
      var offsetY = event.clientY - bounding.top + this.scrollTop;
      var position = 'before';
      if (offsetY >= (event.target.offsetTop + event.target.offsetHeight * 0.5))
        position = 'after';
      this.highlightInsert(event.target, dragoverTraget, position);
    }

    //
    var dropEffect = "none";
    if (dragType === "file") {
      dropEffect = "copy";
    } else if (dragType === "asset") {
      dropEffect = "move";
    }
    EditorUI.DragDrop.updateDropEffect(event.dataTransfer, dropEffect);
  },

  dropAction: function(event) {
    var dragType = EditorUI.DragDrop.type(event.dataTransfer);
    if (dragType !== 'asset' && dragType !== 'entity' && dragType !== 'file')
      return;

    event.preventDefault();
    event.stopPropagation();

    var items = EditorUI.DragDrop.drop(event.dataTransfer);
    var targetEL = this.curDragoverEL;

    this.resetDragState();
    Editor.Selection.cancel();

    if (items.length > 0) {
      if (dragType === 'file') {
        var dstUrl = this.getUrl(targetEL);
        Editor.AssetDB.import(dstUrl, items);
      } else if (dragType === 'asset') {
        this.moveAssets(targetEL, items);
      }
    }
  },

});
