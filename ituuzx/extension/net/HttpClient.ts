import NetClientBase from "./NetClientBase";
import MessageBase from "./MessageBase";
import { NetHelper } from "./NetHelper";

/**
 * http消息发送和解析
 * @author ituuz
 */
export default class HttpClient extends NetClientBase {
    // 数据总长度
    public static readonly DATA_TOTAL_LEN = 4;	
    // 协议号长度
    public static readonly PROTOCOLTYPE_LEN = 4;	

    /**
     * 发送消息协议
     * @param {MessageBase} msg 消息对象
     */
    public sendReq(msg: MessageBase): void {
        let xhr = new XMLHttpRequest();
        xhr.onreadystatechange = () => {
            if (xhr.readyState == 4 && (xhr.status >= 200 && xhr.status < 400)) {
                let response: ArrayBuffer = xhr.response;
                this.encode(response);
            }
        };
        xhr.open("POST", this.addr, true);
        let buffer = this.decode(msg);
        xhr.send(buffer);
    }

    /**
     * 对消息体进行压包
     * @param {MessageBase} msg 消息对象
     * @return {ArrayBuffer} 压包后的而进行数据
     * int32 协议id
     * int32 协议体长度
     * data 协议体
     */
    private decode(msg: MessageBase): ArrayBuffer {
        let buffer = msg.toBuffer();
        let dataView = new DataView(buffer);
        let dataLen = buffer.byteLength;
        let sendBuf = new ArrayBuffer(HttpClient.DATA_TOTAL_LEN + HttpClient.PROTOCOLTYPE_LEN + dataLen);
        let sendView = new DataView(sendBuf);
        sendView.setInt32(0, msg.PID);
        sendView.setInt32(HttpClient.PROTOCOLTYPE_LEN, dataLen);
        for (let i = 0; i < dataLen; i++) {
            sendView.setInt8(HttpClient.PROTOCOLTYPE_LEN + HttpClient.DATA_TOTAL_LEN + i, dataView.getInt8(i));
        }
        return sendBuf;
    }

    /**
     * 对二进制数据进行解包
     * @param {ArrayBuffer} recvBuf 接收到的二进制数据
     */
    private encode(recvBuf: ArrayBuffer) {
        let recvView = new DataView(recvBuf);
        let PID = recvView.getInt32(0); 
        let data = recvBuf.slice(HttpClient.DATA_TOTAL_LEN + HttpClient.PROTOCOLTYPE_LEN, recvBuf.byteLength);
        let cls = NetHelper.getMessageCls(PID);
        let msg: MessageBase = (<any>cls).create(() => {
            msg.parseBuffer(data);
        });
    }
}