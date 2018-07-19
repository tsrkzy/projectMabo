export const roomResolver = (id?: number, title?:string) => {
  /*
   * ルーム検索用API
   * 検索条件を検索用の内部APIへ渡して、その検索結果(Room情報の配列)を返却する
   */
  return [{id: id || 9999, title: title || 'sample title'}]
};
