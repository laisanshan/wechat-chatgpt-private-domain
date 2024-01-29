/**
 * 使用内存作为数据库
 */

class DB {
  
  private static dict: Map<string, string> = new Map();

  /**
   * 添加一个kv
   * @param key
   * @param value
   */
  public put(key: string, value: string): string {
    DB.dict.set(key, value);
    return value;
  }

  /**
   * 获取值
   * @param key
   */
  public get(key: string): string {
    var value = DB.dict.get(key);
    if (typeof value === 'undefined') {
      value = "对不起，请描述清楚！";
    }
    return value;
  }

  /**
   * 是否包含key
   * @param key
   */
  public contains(key: string): boolean {
    var value = DB.dict.get(key);
    return typeof value !== 'undefined';
  }

}
const DBUtils = new DB();
DBUtils.put("你好", "您好！有什么可以帮助您？");
DBUtils.put("新年快乐", "新年快乐");

export default DBUtils;