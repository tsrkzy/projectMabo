"use strict";

const CU           = require('./commonUtil.js');
const toast        = require('./_toast.js');
const ImageManager = require('./_ImageManager');
const Mediator     = require('./_Mediator.js');
const mediator     = new Mediator();

const scenarioId = CU.getScenarioId();
let socket       = undefined;

class Pawn {
  /**
   * コマのプロトタイプ。
   * ボード(boardId)、キャラクタ表の行(characterId)、dogTagとの組み合わせで一意に定まる。
   * @param _socket
   * @param boardId
   * @param characterId
   * @param dogTag
   * @param meta
   * @constructor
   */
  constructor(_socket, boardId, characterId, dogTag, name, meta, key) {
    this.boardId = boardId;
    this.id      = characterId;
    this.dogTag  = dogTag;
    this.name    = name || '';
    this.width   = 50;
    this.height  = 50;
    socket       = _socket;
    this.style   = ( typeof  meta !== 'undefined' && meta.hasOwnProperty('style') )
      ? meta.style
      : {};
    this.attr    = ( typeof  meta !== 'undefined' && meta.hasOwnProperty('attr') )
      ? meta.attr
      : {};
    this.key     = key;
    
    /*
     * DOM初期設定。50x50で固定
     */
    this.dom = $('<div></div>', {
      width : `${this.width}px`,
      height: `${this.height}px`,
      css   : {
        "background-color": '#00B7FF',
        "position"        : 'absolute'
      },
    })
      .attr('data-board-id', boardId)
      .attr('data-character-id', characterId)
      .attr('data-character-dog-tag', dogTag)
      .html(`${characterId}-${dogTag}</br>${boardId}`);
    
    /*
     * 非同期で画像割当
     */
    if (typeof key !== 'undefined') {
      
      let query = CU.getQueryString({key: key});
      
      CU.callApiOnAjax(`/images/signedURI/getObject${query}`, 'get')
        .done((r) => {
          $(this.dom).css({
            "background-size"  : `${this.width}px ${this.height}px`,
            "background-repeat": 'no-repeat',
            "width"            : `${this.width}px`,
            "height"           : `${this.height}px`,
            "border-radius"    : '0.2em',
          });
          if (r) {
            $(this.dom).css({"background-image": `url("${r.uri}")`});
          }
        })
        .fail((r) => {
          console.error(r);
          return false;
        })
    }
    
    /*
     * styleの指定があった場合は上書き
     */
    let styleKeys = Object.keys(this.style).filter(function(v) {
      return v.trim() !== ''
    });
    if (styleKeys.length !== 0) {
      $(this.dom).css(this.style);
    }
    
    /*
     * attrの指定があった場合は上書き
     */
    let attrKeys = Object.keys(this.attr).filter(function(v) {
      return v.trim() !== ''
    });
    if (attrKeys.length !== 0) {
      for (let i = 0; i < attrKeys.length; i++) {
        let key   = attrKeys[i];
        let value = this.attr[key];
        $(this.dom).attr(key, value);
      }
    }
    
    /*
     * クリックで選択できるようにする
     */
    $(this.dom)
      .on('click', (e) => {
        mediator.emit('pawn.clicked', this);
        e.stopPropagation();
      });
    
    /*
     * jQuery-UI のdraggableウィジェット設定
     */
    $(this.dom)
      .draggable({
        grid : [1, 1],
        start: function(e, ui) {
          $(this.dom).css({transition: 'none'})
        },
        stop : function(e) {
          /*
           * ドラッグ終了時、座標を取得してsocketで通知する
           */
          let axis = {
            top : $(e.target).css('top'),
            left: $(e.target).css('left'),
          };
          let data = {
            scenarioId : scenarioId,
            boardId    : boardId,
            characterId: characterId,
            dogTag     : dogTag,
            axis       : axis
          };
          socket.emit('movePawns', data);
        },
      });
    
    /*
     * 右クリック時の処理をオーバーライド
     */
    $(this.dom)
      .on('contextmenu', (e) => {
        let menuProperties = {
          items   : [
            {
              key : 'setImage',
              name: 'この駒に画像を割り当てる'
            },
            {
              key : 'destroy',
              name: 'この駒を削除'
            },
            {
              key : 'copy',
              name: 'このキャラクタの駒を1個増やす'
            }
          ],
          callback: (e, key) => {
            switch (key) {
              case 'setImage':
                mediator.emit('pawn.selectObject', this);
                let im = new ImageManager((imageInfo) => {
                  /*
                   * 画像管理ダイアログで割当ボタンを押下した際のコールバック
                   */
                  this.attachImage(imageInfo.key)
                    .then((r) => {
                      /*
                       * DBへ登録成功後、ローカルのDOM画像を差し替え、ソケットで通知
                       */
                      this.assignImage(imageInfo);
                      this.sendReloadRequest(imageInfo);
                    })
                    .catch((e) => {
                      console.error(e);
                    })
                });
                break;
              case 'destroy':
                let confirm = window.confirm(`この駒を削除してもよろしいですか？`);
                if (confirm !== true) {
                  return false;
                }
                let criteria = {
                  scenarioId : scenarioId,
                  boardId    : boardId,
                  characterId: characterId,
                  dogTag     : dogTag
                };
                mediator.emit('board.deleteCharacter', criteria);
                
                break;
              case 'copy':
                mediator.emit('board.loadCharacter', boardId, characterId);
                break;
            }
          }
        };
        CU.contextMenu(e, menuProperties);
        e.stopPropagation();
      });
    
    /*
     * DOMツリーに追加
     */
    mediator.emit('board.appendPawn', this);
    toast(`コマを作成しました。`);
    
    /*
     * コマの移動があった際、それらを反映する
     */
    socket.on('movePawns', (data) => {
      let boardId     = data.boardId;
      let characterId = data.characterId;
      let dogTag      = data.dogTag;
      if (
        this.boardId === boardId && this.id === characterId && this.dogTag === dogTag
      ) {
        
        let meta = {style: data.axis};
        this.setMeta(meta);
      }
    });
    
    /*
     * 画像の参照先変更リクエスト
     */
    socket.on('attachPawnImage', (data) => {
      let characterId = data.characterId;
      if (characterId !== this.id) {
        return false;
      }
      let imageInfo = data.imageInfo;
      this.assignImage(imageInfo);
    })
  }
  
  setMeta(_meta) {
    /*
     * 要素にstyleもattrも持っていない場合は終了
     */
    if ((!_meta.hasOwnProperty('style')) && (!_meta.hasOwnProperty('attr'))) {
      return false;
    }
    let meta = {};
    /*
     * 要素の指定があった場合は、それぞれについてコマに適用
     */
    meta.style    = _meta.hasOwnProperty('style') ? _meta.style : {};
    meta.attr     = _meta.hasOwnProperty('attr') ? _meta.attr : {};
    let keysStyle = Object.keys(meta.style);
    for (let i = 0; i < keysStyle.length; i++) {
      let key   = keysStyle[i].trim();
      let value = meta.style[key];
      if (key === '') {
        continue;
      }
      
      $(this.dom).css({
        transition: 'top 0.5s ease-in-out, left 0.5s ease-in-out'
      });
      $(this.dom).css(key, value);
      setTimeout(() => {
        $(this.dom).css({transition: 'none'})
      }, 1000);
    }
    let keysAttr = Object.keys(meta.attr);
    for (let i = 0; i < keysAttr.length; i++) {
      let key   = keysAttr[i].trim();
      let value = meta.style[key];
      if (key === '') {
        continue;
      }
      $(this.dom).attr(key, value);
    }
    return false;
  }
  
  /**
   * Domの画像の参照先を変更する
   */
  assignImage(imageInfo) {
    let src = imageInfo.src;
    
    let meta = {
      style: {
        "background-image" : `url("${src}")`,
        "background-size"  : `${this.width}px ${this.height}px`,
        "background-repeat": 'no-repeat',
        "width"            : `${this.width}px`,
        "height"           : `${this.height}px`,
      }
    };
    this.setMeta(meta);
  }
  
  /**
   * 画像の割当情報をDBへ書き込む
   *
   * @param key
   */
  attachImage(key) {
    
    let payload = {
      scenarioId : scenarioId,
      characterId: this.id,
      key        : key
    };
    
    return CU.callApiOnAjax(`/pawns`, 'patch', {data: payload})
  }
  
  /**
   * コマ情報の更新リクエスト
   */
  sendReloadRequest(imageInfo) {
    let payload = {
      scenarioId : scenarioId,
      characterId: this.id,
      imageInfo  : imageInfo
    };
    socket.emit('attachPawnImage', payload);
  }
}

module.exports = Pawn;