// ========================================
// NIRVANA ADDON
// script_files/phone.js
// PART 1 / 5
// ========================================

import {
    world,
    system
} from "@minecraft/server";

import {
    ActionFormData,
    ModalFormData
} from "@minecraft/server-ui";

import {
    generateOrder,
    getActiveOrder,
    getOrderSummary,
    acceptOrder,
    declineOrder,
    getWallet,
    getPlayerReputation
} from "./orders.js";

// ========================================
// VERSION
// ========================================

export const PHONE_VERSION = "1.1.0";

// ========================================
// DYNAMIC PROPERTIES
// ========================================

const MESSAGE_PROPERTY = "nirvana_messages";
const NOTIFICATION_PROPERTY = "nirvana_notification";
const CONTACT_PROPERTY = "nirvana_contacts";
const SETTINGS_PROPERTY = "nirvana_phone_settings";

// ========================================
// PLAYER NAME
// ========================================

const PLAYER_NAME = "Pablo";

// ========================================
// CONTACTS
// ========================================

export const CONTACTS = [

    {
        id: "el_moreno",
        name: "El Moreno",
        vip: false,
        unlock: 0
    },

    {
        id: "mateo_cruz",
        name: "Mateo Cruz",
        vip: false,
        unlock: 20
    },

    {
        id: "rafa_solis",
        name: "Rafa Solis",
        vip: false,
        unlock: 40
    },

    {
        id: "nico_vega",
        name: "Nico Vega",
        vip: false,
        unlock: 60
    },

    {
        id: "sombra",
        name: "Sombra",
        vip: false,
        unlock: 75
    },

    {
        id: "valdez",
        name: "Valdez",
        vip: false,
        unlock: 90
    },

    {
        id: "el_coyote",
        name: "El Coyote",
        vip: true,
        unlock: 100
    },

    {
        id: "marco_viera",
        name: "Marco Viera",
        vip: true,
        unlock: 120
    }

];

// ========================================
// SETTINGS
// ========================================

const DEFAULT_SETTINGS = {

    sound: true,

    notification: true

};

// ========================================
// JSON HELPERS
// ========================================

function loadJSON(player,key,fallback){

    try{

        const raw = player.getDynamicProperty(key);

        if(!raw) return fallback;

        return JSON.parse(raw);

    }

    catch{

        return fallback;

    }

}

function saveJSON(player,key,data){

    player.setDynamicProperty(

        key,

        JSON.stringify(data)

    );

}

// ========================================
// NOTIFICATION
// ========================================

export function hasNotification(player){

    return player.getDynamicProperty(
        NOTIFICATION_PROPERTY
    ) === true;

}

export function setNotification(player,value){

    player.setDynamicProperty(

        NOTIFICATION_PROPERTY,

        value

    );

}

export function clearNotification(player){

    setNotification(player,false);

}

// ========================================
// SETTINGS
// ========================================

export function getSettings(player){

    return loadJSON(

        player,

        SETTINGS_PROPERTY,

        DEFAULT_SETTINGS

    );

}

export function saveSettings(player,data){

    saveJSON(

        player,

        SETTINGS_PROPERTY,

        data

    );

}

// ========================================
// MESSAGE STORAGE
// ========================================

export function getMessages(player){

    return loadJSON(

        player,

        MESSAGE_PROPERTY,

        []

    );

}

export function saveMessages(player,messages){

    saveJSON(

        player,

        MESSAGE_PROPERTY,

        messages

    );

}

// ========================================
// ADD MESSAGE
// ========================================

export function addMessage(player,sender,text){

    const messages = getMessages(player);

    messages.unshift({

        sender,

        text,

        time: new Date().toLocaleTimeString(
            "id-ID",
            {
                hour:"2-digit",
                minute:"2-digit"
            }
        )

    });

    saveMessages(player,messages);

    if(!hasNotification(player)){

        const settings = getSettings(player);

        if(settings.sound){

            player.playSound("random.orb");

        }

    }

    setNotification(player,true);

}

// ========================================
// PLAYER CHAT
// ========================================

export function sendPlayerMessage(player,text){

    addMessage(

        player,

        PLAYER_NAME,

        text

    );

}

export function sendBuyerMessage(player,buyer,text){

    addMessage(

        player,

        buyer,

        text

    );

}

// ========================================
// CONTINUE TO PART 2
// ========================================
// ========================================
// PHONE MENU
// ========================================

export async function openPhone(player){

    const unread = hasNotification(player)
        ? " §c●"
        : "";

    const form = new ActionFormData()

        .title(`📱 Nirvana Phone v${PHONE_VERSION}`)

        .body("Welcome back, Pablo.")

        .button(`💬 Contacts${unread}`)
        .button("📦 Orders")
        .button("💰 Wallet")
        .button("⭐ Reputation")
        .button("📰 News")
        .button("⚙ Settings")
        .button("❌ Close");

    const res = await form.show(player);

    if(res.canceled) return;

    switch(res.selection){

        case 0:
            clearNotification(player);
            return openContacts(player);

        case 1:
            return openOrders(player);

        case 2:
            return openWallet(player);

        case 3:
            return openReputation(player);

        case 4:
            return openNews(player);

        case 5:
            return openSettings(player);

        default:
            return;

    }

}

// ========================================
// CONTACTS
// ========================================

export async function openContacts(player){

    const reputation = getPlayerReputation(player);

    const unlocked = CONTACTS
        .filter(contact => reputation >= contact.unlock)
        .sort((a,b)=>a.unlock-b.unlock);

    const form = new ActionFormData()

        .title("💬 Contacts")

        .body("Select a contact.");

    for(const contact of unlocked){

        const chat = getConversation(
            player,
            contact.name
        );

        const badge = chat.length > 0
            ? ` §7(${chat.length})`
            : "";

        form.button(`${contact.name}${badge}`);

    }

    form.button("🔙 Back");

    const res = await form.show(player);

    if(res.canceled) return;

    if(res.selection === unlocked.length){

        return openPhone(player);

    }

    return openConversation(

        player,

        unlocked[res.selection].name

    );

}

// ========================================
// CONVERSATION
// ========================================

export function getConversation(player,buyer){

    return getMessages(player).filter(msg=>

        msg.sender===buyer ||

        msg.sender===PLAYER_NAME

    );

}

export async function openConversation(player,buyer){

    const messages = getConversation(player,buyer);

    let body = "";

    if(messages.length===0){

        body="§7No messages.";

    }else{

        const chat=[...messages].reverse();

        for(const msg of chat){

            body+=`§e${msg.sender}\n`;
            body+=`§7${msg.time}\n`;
            body+=`§f${msg.text}\n\n`;

        }

    }

    const form = new ActionFormData()

        .title(`💬 ${buyer}`)

        .body(body)

        .button("🔙 Contacts")

        .button("📱 Phone");

    const res = await form.show(player);

    if(res.canceled) return;

    switch(res.selection){

        case 0:
            return openContacts(player);

        case 1:
            return openPhone(player);

    }

}

// ========================================
// CONTINUE TO PART 3
// ========================================
// ========================================
// ORDERS MENU
// ========================================

export async function openOrders(player){

    let order = getActiveOrder(player);

    if(!order){

        const form = new ActionFormData()

            .title("📦 Orders")

            .body(
`No active orders.

Request a new deal?`
            )

            .button("📩 Request Order")

            .button("🔙 Back");

        const res = await form.show(player);

        if(res.canceled) return;

        if(res.selection === 0){

            generateOrder(player);

            return openOrders(player);

        }

        return openPhone(player);

    }

    const form = new ActionFormData()

        .title("📦 Active Order")

        .body(getOrderSummary(order))

        .button("✅ Accept")

        .button("❌ Decline")

        .button("🔙 Back");

    const res = await form.show(player);

    if(res.canceled) return;

    switch(res.selection){

        case 0:

            acceptOrder(player);

            sendPlayerMessage(
                player,
                "I'm interested."
            );

            return openPhone(player);

        case 1:

            declineOrder(player);

            return openPhone(player);

        case 2:

            return openPhone(player);

    }

}

// ========================================
// WALLET
// ========================================

export async function openWallet(player){

    const wallet = getWallet(player);

    const form = new ActionFormData()

        .title("💰 Wallet")

        .body(
`Current Balance

$${wallet}`
        )

        .button("🔙 Back");

    await form.show(player);

    return openPhone(player);

}

// ========================================
// REPUTATION
// ========================================

export async function openReputation(player){

    const reputation = getPlayerReputation(player);

    const form = new ActionFormData()

        .title("⭐ Reputation")

        .body(
`Current Reputation

${reputation}`
        )

        .button("🔙 Back");

    await form.show(player);

    return openPhone(player);

}

// ========================================
// NEWS
// ========================================

let NEWS = [

    "Market demand is stable.",

    "Police activity remains low.",

    "VIP buyers are watching.",

    "Dead Drops are active."

];

export function updateNews(news){

    NEWS = news;

}

export async function openNews(player){

    const form = new ActionFormData()

        .title("📰 News")

        .body(
NEWS.join("\n\n")
        )

        .button("🔙 Back");

    await form.show(player);

    return openPhone(player);

}

// ========================================
// SETTINGS
// ========================================

export async function openSettings(player){

    const settings = getSettings(player);

    const form = new ModalFormData()

        .title("⚙ Settings")

        .toggle(
            "Notification Sound",
            settings.sound
        )

        .toggle(
            "Notifications",
            settings.notification
        );

    const res = await form.show(player);

    if(res.canceled){

        return openPhone(player);

    }

    settings.sound = res.formValues[0];
    settings.notification = res.formValues[1];

    saveSettings(
        player,
        settings
    );

    return openPhone(player);

}

// ========================================
// CONTINUE TO PART 4
// ========================================
// ========================================
// PHONE NOTIFICATIONS
// ========================================

export function notifyNewOrder(player, buyer){

    sendBuyerMessage(
        player,
        buyer,
        "Need something."
    );

}

export function notifySignal(player, buyer){

    sendBuyerMessage(
        player,
        buyer,
        "Secure signal established."
    );

}

export function notifyDeadDrop(player, buyer, location){

    sendBuyerMessage(
        player,
        buyer,
        `Drop is ready.\n📍 ${location}`
    );

}

export function notifySuccess(player, buyer, reward){

    sendPlayerMessage(
        player,
        "Package delivered."
    );

    sendBuyerMessage(
        player,
        buyer,
        `Nice work.\n$${reward} transferred.`
    );

    clearNotification(player);

}

export function notifyFailed(player, buyer){

    sendBuyerMessage(
        player,
        buyer,
        "Too slow.\nDeal cancelled."
    );

}

// ========================================
// CONTACT HELPERS
// ========================================

export function unlockContact(player, contactId){

    const contacts = loadJSON(
        player,
        CONTACT_PROPERTY,
        []
    );

    if(!contacts.includes(contactId)){

        contacts.push(contactId);

        saveJSON(
            player,
            CONTACT_PROPERTY,
            contacts
        );

    }

}

export function hasUnlockedContact(player, contactId){

    const contacts = loadJSON(
        player,
        CONTACT_PROPERTY,
        []
    );

    return contacts.includes(contactId);

}

// ========================================
// PHONE INITIALIZE
// ========================================

export function initializePhone(player){

    if(!player.getDynamicProperty(MESSAGE_PROPERTY)){

        saveMessages(player, []);

    }

    if(player.getDynamicProperty(
        NOTIFICATION_PROPERTY
    ) === undefined){

        setNotification(player,false);

    }

    if(!player.getDynamicProperty(
        SETTINGS_PROPERTY
    )){

        saveSettings(
            player,
            DEFAULT_SETTINGS
        );

    }

}

// ========================================
// PLAYER SPAWN
// ========================================

world.afterEvents.playerSpawn.subscribe(event=>{

    initializePhone(event.player);

});

// ========================================
// PHONE ITEM
// ========================================

world.beforeEvents.itemUse.subscribe(event=>{

    const player = event.source;
    const item = event.itemStack;

    if(!item) return;

    if(item.typeId !== "nirvana:mobile_phone")
        return;

    system.run(()=>{

        openPhone(player);

    });

});

// ========================================
// QUICK API
// ========================================

export function receiveOrder(player,buyer){

    notifyNewOrder(player,buyer);

}

export function receiveSignal(player,buyer){

    notifySignal(player,buyer);

}

export function receiveDeadDrop(player,buyer,location){

    notifyDeadDrop(
        player,
        buyer,
        location
    );

}

export function receiveReward(player,buyer,reward){

    notifySuccess(
        player,
        buyer,
        reward
    );

}

export function receiveFailure(player,buyer){

    notifyFailed(
        player,
        buyer
    );

}

// ========================================
// CONTINUE TO PART 5
// ========================================
// ========================================
// STARTUP
// ========================================

system.run(() => {

    for (const player of world.getPlayers()) {

        initializePhone(player);

    }

});

// ========================================
// PHONE API
// ========================================

export function openPhoneItem(player){

    system.run(() => {

        openPhone(player);

    });

}

export function clearPhone(player){

    saveMessages(player, []);

    clearNotification(player);

}

export function resetPhone(player){

    saveMessages(player, []);

    saveSettings(player, DEFAULT_SETTINGS);

    player.setDynamicProperty(
        CONTACT_PROPERTY,
        JSON.stringify([])
    );

    clearNotification(player);

}

// ========================================
// DEBUG
// ========================================

export function debugPhone(player){

    sendBuyerMessage(
        player,
        "System",
        `Phone Version ${PHONE_VERSION}`
    );

    sendBuyerMessage(
        player,
        "System",
        "Debug completed successfully."
    );

}

// ========================================
// PHONE READY
// ========================================

export function phoneReady(player){

    initializePhone(player);

    if(getMessages(player).length === 0){

        sendBuyerMessage(

            player,

            "System",

            "Welcome to Nirvana Phone."

        );

    }

}

// ========================================
// EXPORTS
// ========================================

export {

    PLAYER_NAME,

    CONTACT_PROPERTY,

    MESSAGE_PROPERTY,

    NOTIFICATION_PROPERTY,

    SETTINGS_PROPERTY

};

// ========================================
// END OF FILE
// ========================================