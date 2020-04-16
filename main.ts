/*
Riven
load dependency
"makercloud": "file:../pxt-makercloud"
*/

//% color="#31C7D5" weight=10 icon="\uf1eb"
namespace Makercloud_Kitten {
    const CMD_SYNC = 1;
    const CMD_RESP_V = 2;
    const CMD_RESP_CB = 3;
    const CMD_WIFISTATUS = 4;
    const CMD_WIFIINFO = 8;
    const CMD_SETHOSTNAME = 9;
    const CMD_MQTT_SETUP = 10;
    const CMD_MQTT_PUB = 11;
    const CMD_MQTT_SUB = 12;
    const CMD_MQTT_SETHOST = 15;
    const CMD_REST_SETUP = 20;
    const CMD_REST_REQ = 21;
    const CMD_REST_RET = 23;
    const CMD_SOCK_SETUP = 40;
    const CMD_SOCK_SEND = 41;
    const CMD_SOCK_DATA = 42;
    const CMD_WIFI_SELECT = 52;

    export enum Callback {
        WIFI_STATUS_CHANGED = 1,
        MQTT_CONN = 2,
        MQTT_DISCON = 3,
        MQTT_PUB = 4,
        MQTT_DATA = 5,
        UDP_SETUP = 6,
        UDP_DATA = 7
    }

    const PortSerial = [
        [SerialPin.P8, SerialPin.P0],
        [SerialPin.P12, SerialPin.P1],
        [SerialPin.P13, SerialPin.P2],
        [SerialPin.P15, SerialPin.P14]
    ]

    export enum SerialPorts {
        PORT1 = 0,
        PORT2 = 1,
        PORT3 = 2,
        PORT4 = 3
    }
    let SERIAL_TX = SerialPin.P2
    let SERIAL_RX = SerialPin.P1

    let PROD_SERVER = "mqtt.makercloud.scaleinnotech.com"
    let SIT_SERVER = "mqtt.makercloud-sit.scaleinnotech.com"
    let SERVER = PROD_SERVER
    let ipAddr: string = '';
    let v: string;

    export class StringMessageHandler {
        topicName: string;
        fn: (stringMessage: string) => void;
    }

    export class KeyValueMessageHandler {
        topicName: string;
        fn: (key: string, value: string) => void;
    }

    let stringMessageHandlerList: StringMessageHandler[] = [
        new StringMessageHandler()
    ]
    let keyValueMessageHandlerList: KeyValueMessageHandler[] = [
        new KeyValueMessageHandler()
    ]


    export class KeyValueMessage {
        key: string;
        value: string;
    }

    export class MakerCloudMessage {
        deviceName: string;
        deviceSerialNumber: string;
        rawMessage: string;
        stringMessageList: string[];
        keyValueMessagList: KeyValueMessage[];
    }

    function trim(t: string): string {
        if (t.charAt(t.length - 1) == ' ') {
            t = t.substr(0, t.length - 1)
        }
        return t;
    }

    function seekNext(space: boolean = true): string {
        for (let i = 0; i < v.length; i++) {
            if ((space && v.charAt(i) == ' ') || v.charAt(i) == '\r' || v.charAt(i) == '\n') {
                let ret = v.substr(0, i)
                v = v.substr(i + 1, v.length - i)
                return ret;
            }
        }
        return '';
    }

    function parseCallback(cb: number) {
        if (Callback.WIFI_STATUS_CHANGED == cb) {
            let stat = parseInt(seekNext())
            if (stat == 5) {
                serial.writeString("WF 10 4 0 2 3 4 5\n") // mqtt callback install
                ipAddr = seekNext()
            } else {
                ipAddr = ''
            }
        } else if (Callback.MQTT_DATA == cb) {
            let topic: string = seekNext()
            let data = trim(seekNext(false));
            let makerCloudMessage = parseMakerCloudMessage(data);
            handleTopicStringMessage(topic, makerCloudMessage.stringMessageList);
            handleTopicKeyValueMessage(topic, makerCloudMessage.keyValueMessagList)
            //if (mqttCbTopicData) {
            //    mqttCbTopicData(topic, data)
            //}
        } else if (Callback.MQTT_CONN == cb) {
            // resubscribe?
            //for (let i = 0; i < mqttCbCnt; i++) {
            //    serial.writeString("WF 12 2 0 " + mqttCbKey[i] + ' 0\n')
            //    basic.pause(300)
            //}
        }
    }



    /**
     * @param SSID to SSID ,eg: "yourSSID"
     * @param PASSWORD to PASSWORD ,eg: "yourPASSWORD"
     */
    //% blockId=mc_kt_wifi_setup
    //% block="connect Wi-Fi: | name: %ssid| password: %password"
    export function setupWifi(ssid: string, password: string) {
        let cmd: string = 'WF 52 2 52 ' + ssid + ' ' + password + '\n'
        serial.writeString(cmd)
        showLoading(7000)
    }

    /**
     * For testing purpose
     */
    //% blockId=mc_kt_change_to_sit
    //% block="Maker Cloud Lab"
    //% advanced=true
    export function changeToSitServer() {
        SERVER = SIT_SERVER
    }

    /**
     * Configuration RX TX Pin
     */
    //% blockId=mc_kt_config_rxtx
    //% block="Update Pin: | RX: %rx| TX: %tx"
    //% advanced=true
    export function configRxTxPin(rx: SerialPin, tx: SerialPin) {
        SERIAL_TX = tx
        SERIAL_RX = rx
    }

    //% blockId=mc_kt_config_pwbrick
    //% block="Update Pin powerbrick Port|%port"
    //% advanced=true
    export function configRxTxPwbrick(port: SerialPorts): void {
        SERIAL_TX = PortSerial[port][1]
        SERIAL_RX = PortSerial[port][0]
    }

    export function showLoading(time: number) {
        let internal = time / 5;
        basic.showLeds(`
            # . . . .
            . . . . .
            . . . . .
            . . . . .
            . . . . .
            `)
        basic.pause(internal)

        basic.showLeds(`
            # # . . .
            . . . . .
            . . . . .
            . . . . .
            . . . . .
            `)
        basic.pause(internal)

        basic.showLeds(`
            # # . . .
            . . . . .
            . . . . .
            . . . . .
            . . . . .
            `)
        basic.pause(internal)

        basic.showLeds(`
            # # # . .
            . . . . .
            . . . . .
            . . . . .
            . . . . .
            `)
        basic.pause(internal)

        basic.showLeds(`
            # # # # #
            . . . . .
            . . . . .
            . . . . .
            . . . . .
            `)
        basic.pause(internal)
        basic.showString("")
    }

    /**
     * @param topic ,eg: "topic"
     * @param message ,eg: "message"
     */
    //% blockId=mc_kt_publish_message_to_topic
    //% block="tell %topic about %message"
    //% advance=true
    export function publishToTopic(topic: string, message: string) {
        message = "_dsn=" + control.deviceSerialNumber() + ",_dn=" + control.deviceName() + "," + message
        let cmd: string = 'WF 11 4 11 0 0 ' + topic + ' ' + message + '\n'
        serial.writeString(cmd)
        basic.pause(200) // limit user pub rate
    }

    /**
     * @param topic ,eg: "topic"
     * @param key ,eg: "key"
     * @param value ,eg: "value"
     */
    //% blockId=mc_kt_publish_key_value_message_to_topic
    //% block="tell %topic about %key = $value"
    //% advance=true
    export function publishKeyValueToTopic(topic: string, key: string, value: string) {
        let message = "_dsn=" + control.deviceSerialNumber() + ",_dn=" + control.deviceName() + "," + key + "=" + value
        let cmd: string = 'WF 11 4 11 0 0 ' + topic + ' ' + message + '\n'
        serial.writeString(cmd)
        basic.pause(200) // limit user pub rate        
    }

    /**
     * Connect your device to MQTT Server
     */
    //% blockId=mc_kt_connect_mqtt
    //% block="connect mqtt"
    export function connectMqtt() {
        let cmd: string = 'WF 15 2 15 ' + SERVER + ' ' + control.deviceName() + '\n'
        serial.writeString(cmd)
        basic.pause(1000)
        // reset mqtt handler
        serial.writeString("WF 10 4 0 2 3 4 5\n") // mqtt callback install
        basic.pause(500)
        showLoading(1000);
    }

    /**
     * Subscribe to MQTT topic
     * @param topics to topics ,eg: "ZXY,ABC"
     */
    //% blockId=mc_kt_subscribe_topic
    //% block="i want to listen to %topics"
    export function subscrbeTopic(topics: string) {
        let topicList = splitMessage(topics, ",")
        let i = 0
        for (i = 0; i < topicList.length; i++) {
            if (topicList[i] != "") {
                serial.writeString("WF 12 2 0 " + topicList[i] + ' 0\n')
                basic.pause(50)
            }
        }
    }

    /**
     * Listener for MQTT topic
     * @param topic to topic ,eg: "ZXY"
     */
    //% blockId=mc_kt_register_topic_text_message_handler
    //% block="When something talk to %topic, then"
    export function registerTopicMessageHandler(topic: string, fn: (textMessage: string) => void) {
        let topicHandler = new StringMessageHandler()
        topicHandler.fn = fn
        topicHandler.topicName = topic
        stringMessageHandlerList.push(topicHandler)
    }

    /**
     * Listener for MQTT topic
     * @param topic to topic ,eg: "ZXY"
     */
    //% blockId=mc_kt_register_topic_key_value_message_handler
    //% block="When something talk to %topic, then"
    export function registerTopicKeyValueMessageHandler(topic: string, fn: (key: string, value: string) => void) {
        let topicHandler = new KeyValueMessageHandler()
        topicHandler.fn = fn
        topicHandler.topicName = topic
        keyValueMessageHandlerList.push(topicHandler)



    }

    serial.onDataReceived('\n', function () {
        v = serial.readString()
        let argv: string[] = []

        if (v.charAt(0) == 'W' && v.charAt(1) == 'F') {
            v = v.substr(3, v.length - 3) + ' '
            let cmd = parseInt(seekNext())
            let argc = parseInt(seekNext())
            let cb = parseInt(seekNext())

            //  todo: is there an async way to handle response value?
            if (cmd == CMD_RESP_CB) {
                parseCallback(cb)
            }
        }
    })


    /**
     * @param SSID to SSID ,eg: "yourSSID"
     * @param PASSWORD to PASSWORD ,eg: "yourPASSWORD"
     * @param IOT_TOPIC to IOT_TOPIC ,eg: "yourIotTopic"
     */
    //% weight=102
    //% blockId=mc_kt_init
    //% block="Initialise Maker Cloud"
    export function init() {
        serial.redirect(
            SERIAL_TX,
            SERIAL_RX,
            BaudRate.BaudRate115200
        )

        basic.pause(500)
        serial.setRxBufferSize(64);
        serial.setTxBufferSize(64);
        serial.readString()
        serial.writeString('\n\n')
        basic.pause(1000)
        serial.writeString("WF 1 0 1\n") // sync command to add wifi status callback
        basic.pause(1000)
        serial.writeString("WF 10 4 0 2 3 4 5\n") // mqtt callback install
    }


    function handleTopicStringMessage(topic: string, stringMessageList: string[]) {
        let i = 0
        for (i = 0; i < stringMessageHandlerList.length; i++) {
            if (stringMessageHandlerList[i].topicName == topic) {
                let j = 0;
                for (j = 0; j < stringMessageList.length; j++) {
                    stringMessageHandlerList[i].fn(stringMessageList[j]);
                }
                break
            }
        }
    }

    function handleTopicKeyValueMessage(topic: string, keyValueMessageList: KeyValueMessage[]) {
        let i = 0
        for (i = 0; i < keyValueMessageHandlerList.length; i++) {
            if (keyValueMessageHandlerList[i].topicName == topic) {
                let j = 0;
                for (j = 0; j < keyValueMessageList.length; j++) {
                    keyValueMessageHandlerList[i].fn(keyValueMessageList[j].key, keyValueMessageList[j].value);
                }
                break
            }
        }
    }

    function splitMessage(message: string, delimitor: string): string[] {
        let messages: string[] = [""];
        let i = 0;
        let messagesIndex = 0;

        for (i = 0; i < message.length; i++) {
            let letter: string = message.charAt(i)
            if (letter == delimitor) {
                messages[++messagesIndex] = ""
            } else {
                messages[messagesIndex] += letter
            }
        }

        return messages
    }

    export function parseMakerCloudMessage(topicMessage: string): MakerCloudMessage {
        let makerCloudMessage = new MakerCloudMessage();
        makerCloudMessage.rawMessage = topicMessage;
        makerCloudMessage.deviceName = "";
        makerCloudMessage.deviceSerialNumber = "";
        makerCloudMessage.keyValueMessagList = [];
        makerCloudMessage.stringMessageList = [];

        let delimitor = ",";
        let start = 0;
        let oldMessage: string = topicMessage;

        let i = 0;
        let total = countDelimitor(oldMessage, delimitor);
        for (i = 0; i <= total; i++) {
            let end = oldMessage.indexOf(delimitor);
            if (end == -1) {
                end = oldMessage.length
            }
            let subMessage = oldMessage.substr(0, end);
            if (subMessage.indexOf("=") == -1) {
                makerCloudMessage.stringMessageList[makerCloudMessage.stringMessageList.length] = subMessage
            } else {
                let splitIndex = subMessage.indexOf("=");
                let key = subMessage.substr(0, splitIndex);
                let value = subMessage.substr(splitIndex + 1)

                if (value.length > 0) {
                    if (key == "_dsn") {
                        makerCloudMessage.deviceSerialNumber = value;
                    } else if (key == "_dn") {
                        makerCloudMessage.deviceName = value;
                    } else {
                        let keyValue = new KeyValueMessage();
                        keyValue.key = key;
                        keyValue.value = value;
                        makerCloudMessage.keyValueMessagList[makerCloudMessage.keyValueMessagList.length] = keyValue;
                    }
                }
            }
            oldMessage = oldMessage.substr(end + 1, oldMessage.length);
        }

        return makerCloudMessage;
    }

    export function countDelimitor(msg: string, delimitor: string): number {
        let count: number = 0;
        let i = 0;
        for (i = 0; i < msg.length; i++) {
            if (msg.charAt(i) == delimitor) {
                count++;
            }
        }
        return count;
    }

    function splitMessageOnFirstDelimitor(message: string, delimitor: string): string[] {

        let beforeDelimitor = ""
        let afterDelimitor = ""
        let i = 0
        let delimitorPassed = false
        for (i = 0; i < message.length; i++) {
            let letter: string = message.charAt(i)

            if (letter == delimitor) {
                delimitorPassed = true
                continue
            }

            if (delimitorPassed) {
                afterDelimitor += letter
            } else {
                beforeDelimitor += letter
            }
        }
        return [beforeDelimitor, afterDelimitor];
    }

}
