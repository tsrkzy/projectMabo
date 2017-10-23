"use strict";

const CU = require('./commonUtil.js');

const scenarioId = CU.getScenarioId();


let socket = undefined;

/**
 * チャット履歴データの保持、取得I/Fクラス
 * @param _socket
 * @constructor
 */
let Log = function(_socket) {
  socket    = _socket;
  this.list = [];
  
  
  socket.on('chatMessage', (container) => {
    /*
     * チャットを受信した際の処理
     */
    this.insert(container);
  });
  
  socket.on('changeSpeaker', (container) => {
    /*
     * 発言者変更を受信した際の処理
     */
    this.insert(container);
  });
  
};

/**
 * チャット履歴データをストアする
 * @param _lines
 */
Log.prototype.insert = function(_lines) {
  /*
   * 入力が配列でなかった場合は配列へ変換
   */
  let lines = _lines instanceof Array === false ? [_lines] : _lines;
  
  /*
   * listへ追加
   */
  this.list.push(lines)
};

/**
 * Promise返却
 * DBからAjaxでシナリオに紐づく全チャットデータを取得
 */
Log.prototype.loadFromDB = function() {
  return CU.callApiOnAjax(process.env.API_EP_LOGS, 'get', {data: {scenarioId: scenarioId}})
    .done((result) => {
      this.list = result
    });
};

module.exports = Log;