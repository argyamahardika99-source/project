// ========================================
// NIRVANA ADDON
// script_files/orders.js
// PART 1
// ========================================

import { world, system } from "@minecraft/server";

import { CONFIG } from "./config.js";
import { getRandomBuyer, getRandomMessage } from "./buyers.js";
import { getRandomProduct, getRandomPrice } from "./market.js";
import { getRandomEvent } from "./events.js";

import {
    randomInt,
    generateOrderId
} from "./utils.js";

// ========================================
// Dynamic Property Keys
// ========================================

const ORDER_PROPERTY = "nirvana_active_order";
const LAST_EVENT_PROPERTY = "nirvana_daily_event";

// ========================================
// Active Event
// ========================================

let currentEvent = getRandomEvent();

// ========================================
// Generate Order
// ========================================

export function generateOrder(player) {

    if (getActiveOrder(player)) {
        return null;
    }

    const reputation = getPlayerReputation(player);

    const vip = reputation >= CONFIG.VIP_REPUTATION;

    const buyer = getRandomBuyer(vip);

    const product = getRandomProduct();

    const amount = randomInt(
        CONFIG.MIN_ORDER_AMOUNT,
        CONFIG.MAX_ORDER_AMOUNT
    );

    const unitPrice = getRandomPrice(product);

    let reward = unitPrice * amount;

    reward = Math.floor(
        reward * currentEvent.rewardMultiplier
    );

    const order = {

        id: generateOrderId(),

        buyer: buyer,

        item: product.item,

        display: product.display,

        amount: amount,

        unitPrice: unitPrice,

        reward: reward,

        timer: CONFIG.ORDER_TIME,

        status: "waiting",

        accepted: false,

        completed: false,

        created: Date.now(),

        messages: {

            greeting: getRandomMessage("greeting"),

            accepted: getRandomMessage("accepted"),

            location: getRandomMessage("location"),

            completed: getRandomMessage("completed"),

            failed: getRandomMessage("failed")

        }

    };

    saveOrder(player, order);

    return order;

}

// ========================================
// Active Order
// ========================================

export function getActiveOrder(player){

    try{

        const raw = player.getDynamicProperty(
            ORDER_PROPERTY
        );

        if(!raw) return null;

        return JSON.parse(raw);

    }catch{

        return null;

    }

}

// ========================================
// Save Order
// ========================================

export function saveOrder(player, order){

    player.setDynamicProperty(

        ORDER_PROPERTY,

        JSON.stringify(order)

    );

}

// ========================================
// Delete Order
// ========================================

export function clearOrder(player){

    player.setDynamicProperty(

        ORDER_PROPERTY,

        undefined

    );

}

// ========================================
// Accept Order
// ========================================

export function acceptOrder(player){

    const order = getActiveOrder(player);

    if(!order) return false;

    order.accepted = true;

    order.status = "accepted";

    saveOrder(player, order);

    return true;

}

// ========================================
// Decline Order
// ========================================

export function declineOrder(player){

    clearOrder(player);

    return true;

}

// ========================================
// Complete Order
// ========================================

export function completeOrder(player){

    const order = getActiveOrder(player);

    if(!order) return false;

    order.completed = true;

    order.status = "completed";

    saveOrder(player, order);

    return true;

}

// ========================================
// Fail Order
// ========================================

export function failOrder(player){

    const order = getActiveOrder(player);

    if(!order) return false;

    order.completed = true;

    order.status = "failed";

    saveOrder(player, order);

    return true;

}

// ========================================
// CONTINUE TO PART 2
// ========================================
// ========================================
// ORDER TIMER
// ========================================

export function updateOrderTimer(player) {

    const order = getActiveOrder(player);

    if (!order) return;

    if (!order.accepted) return;

    if (order.completed) return;

    order.timer--;

    if (order.timer <= 0) {

        failOrder(player);

        return;

    }

    saveOrder(player, order);

}

// ========================================
// TIMER LOOP
// ========================================

system.runInterval(() => {

    for (const player of world.getPlayers()) {

        updateOrderTimer(player);

    }

}, 20);

// ========================================
// REWARD
// ========================================

export function calculateReward(player) {

    const order = getActiveOrder(player);

    if (!order) return 0;

    let reward = order.reward;

    if (isNightBonus()) {

        reward *= CONFIG.NIGHT_BONUS;

    }

    return Math.floor(reward);

}

// ========================================
// NIGHT BONUS
// ========================================

export function isNightBonus() {

    const time = world.getTimeOfDay();

    return time >= 13000 || time <= 1000;

}

// ========================================
// PLAYER REPUTATION
// ========================================

export function getPlayerReputation(player) {

    const value = player.getDynamicProperty("nirvana_reputation");

    return Number(value ?? 0);

}

export function addReputation(player, amount) {

    const rep = getPlayerReputation(player) + amount;

    player.setDynamicProperty(

        "nirvana_reputation",

        rep

    );

}

export function removeReputation(player, amount) {

    const rep = Math.max(

        0,

        getPlayerReputation(player) - amount

    );

    player.setDynamicProperty(

        "nirvana_reputation",

        rep

    );

}

// ========================================
// PLAYER MONEY
// ========================================

export function getWallet(player) {

    const value = player.getDynamicProperty("nirvana_wallet");

    return Number(value ?? 0);

}

export function addMoney(player, amount) {

    const money = getWallet(player) + amount;

    player.setDynamicProperty(

        "nirvana_wallet",

        money

    );

}

// ========================================
// COMPLETE DELIVERY
// ========================================

export function rewardPlayer(player) {

    const order = getActiveOrder(player);

    if (!order) return false;

    const reward = calculateReward(player);

    addMoney(player, reward);

    addReputation(player, 2);

    completeOrder(player);

    return true;

}

// ========================================
// BUYER CHAT
// ========================================

export function getBuyerGreeting(player) {

    const order = getActiveOrder(player);

    if (!order) return "";

    return order.messages.greeting;

}

export function getBuyerAccepted(player) {

    const order = getActiveOrder(player);

    if (!order) return "";

    return order.messages.accepted;

}

export function getBuyerLocation(player) {

    const order = getActiveOrder(player);

    if (!order) return "";

    return order.messages.location;

}

export function getBuyerCompleted(player) {

    const order = getActiveOrder(player);

    if (!order) return "";

    return order.messages.completed;

}

export function getBuyerFailed(player) {

    const order = getActiveOrder(player);

    if (!order) return "";

    return order.messages.failed;

}

// ========================================
// CONTINUE TO PART 3
// ========================================
// ========================================
// DEAD DROP DATA
// ========================================

const DROP_PROPERTY = "nirvana_drop";

export function saveDrop(player, drop) {

    player.setDynamicProperty(
        DROP_PROPERTY,
        JSON.stringify(drop)
    );

}

export function getDrop(player) {

    try {

        const raw = player.getDynamicProperty(
            DROP_PROPERTY
        );

        if (!raw) return null;

        return JSON.parse(raw);

    } catch {

        return null;

    }

}

export function clearDrop(player) {

    player.setDynamicProperty(
        DROP_PROPERTY,
        undefined
    );

}

// ========================================
// SIGNAL SYSTEM
// ========================================

export function hasSignal(player, villagePos) {

    const dx = player.location.x - villagePos.x;
    const dz = player.location.z - villagePos.z;

    const distance = Math.sqrt(dx * dx + dz * dz);

    return distance <= CONFIG.SIGNAL_RADIUS;

}

// ========================================
// CREATE DEAD DROP
// ========================================

export function createDeadDrop(player, locationName, position) {

    const drop = {

        location: locationName,

        x: position.x,

        y: position.y,

        z: position.z,

        spawned: false,

        delivered: false

    };

    saveDrop(player, drop);

    return drop;

}

// ========================================
// SPAWN SHULKER
// ========================================

export function spawnDeadDrop(player) {

    const drop = getDrop(player);

    if (!drop) return false;

    if (drop.spawned) return true;

    const dimension = player.dimension;

    dimension.runCommandAsync(

        `setblock ${Math.floor(drop.x)} ${Math.floor(drop.y)} ${Math.floor(drop.z)} brown_shulker_box`

    );

    drop.spawned = true;

    saveDrop(player, drop);

    return true;

}

// ========================================
// REMOVE SHULKER
// ========================================

export function removeDeadDrop(player) {

    const drop = getDrop(player);

    if (!drop) return;

    const dimension = player.dimension;

    dimension.runCommandAsync(

        `setblock ${Math.floor(drop.x)} ${Math.floor(drop.y)} ${Math.floor(drop.z)} air`

    );

    clearDrop(player);

}

// ========================================
// VALIDATE DELIVERY
// ========================================

export function validateDelivery(player, itemId, amount) {

    const order = getActiveOrder(player);

    if (!order) return false;

    if (order.item !== itemId) {

        return false;

    }

    if (amount < order.amount) {

        return false;

    }

    return true;

}

// ========================================
// FINISH DELIVERY
// ========================================

export function finishDelivery(player, itemId, amount) {

    if (!validateDelivery(player, itemId, amount)) {

        return false;

    }

    rewardPlayer(player);

    removeDeadDrop(player);

    clearOrder(player);

    return true;

}

// ========================================
// SIGNAL CHECK
// ========================================

export function tryActivateDrop(player, villagePos, locationName, dropPos) {

    if (!hasSignal(player, villagePos)) {

        return false;

    }

    if (!getDrop(player)) {

        createDeadDrop(

            player,

            locationName,

            dropPos

        );

    }

    spawnDeadDrop(player);

    return true;

}

// ========================================
// CONTINUE TO PART 4
// ========================================
// ========================================
// DROP LOCATION DATABASE
// ========================================

export const DROP_LOCATIONS = [

    {
        id: "farmer_house",
        name: "Behind Farmer House",

        signal: {
            x: 0,
            y: 0,
            z: 0
        },

        drop: {
            x: 0,
            y: 0,
            z: 0
        }
    },

    {
        id: "butcher_shop",
        name: "Behind Butcher Shop",

        signal: {
            x: 0,
            y: 0,
            z: 0
        },

        drop: {
            x: 0,
            y: 0,
            z: 0
        }
    },

    {
        id: "toolsmith_house",
        name: "Behind Toolsmith House",

        signal: {
            x: 0,
            y: 0,
            z: 0
        },

        drop: {
            x: 0,
            y: 0,
            z: 0
        }
    },

    {
        id: "church",
        name: "Behind Church",

        signal: {
            x: 0,
            y: 0,
            z: 0
        },

        drop: {
            x: 0,
            y: 0,
            z: 0
        }
    }

];

// ========================================
// RANDOM DROP LOCATION
// ========================================

export function getRandomDropLocation() {

    return DROP_LOCATIONS[
        randomInt(
            0,
            DROP_LOCATIONS.length - 1
        )
    ];

}

// ========================================
// ASSIGN LOCATION
// ========================================

export function assignDropLocation(player) {

    const order = getActiveOrder(player);

    if (!order) return null;

    if (order.dropLocation) {

        return order.dropLocation;

    }

    const location = getRandomDropLocation();

    order.dropLocation = location;

    saveOrder(player, order);

    return location;

}

// ========================================
// BUYER TRUST
// ========================================

export function addBuyerTrust(player, amount = 1) {

    const order = getActiveOrder(player);

    if (!order) return;

    order.buyer.trust += amount;

    if (order.buyer.trust > CONFIG.MAX_BUYER_TRUST) {

        order.buyer.trust = CONFIG.MAX_BUYER_TRUST;

    }

    saveOrder(player, order);

}

export function removeBuyerTrust(player, amount = 2) {

    const order = getActiveOrder(player);

    if (!order) return;

    order.buyer.trust -= amount;

    if (order.buyer.trust < CONFIG.MIN_BUYER_TRUST) {

        order.buyer.trust = CONFIG.MIN_BUYER_TRUST;

    }

    saveOrder(player, order);

}

// ========================================
// DAILY EVENT
// ========================================

export function rotateDailyEvent() {

    currentEvent = getRandomEvent();

}

// ========================================
// GET CURRENT EVENT
// ========================================

export function getCurrentEvent() {

    return currentEvent;

}

// ========================================
// VIP ORDER CHECK
// ========================================

export function canGenerateVip(player) {

    return getPlayerReputation(player)
        >= CONFIG.VIP_REPUTATION;

}

// ========================================
// ORDER LIMIT
// ========================================

export function hasOrder(player) {

    return getActiveOrder(player) !== null;

}

// ========================================
// ORDER SUMMARY
// ========================================

export function getOrderSummary(player) {

    const order = getActiveOrder(player);

    if (!order) return null;

    return {

        buyer: order.buyer.name,

        item: order.display,

        amount: order.amount,

        reward: order.reward,

        timer: order.timer,

        status: order.status,

        location: order.dropLocation
            ? order.dropLocation.name
            : "Unknown"

    };

}

// ========================================
// CONTINUE TO PART 5
// ========================================
// ========================================
// BELL INTERACTION
// ========================================

export function onVillageBellUsed(player, villagePos) {

    const order = getActiveOrder(player);

    if (!order) return false;

    if (!order.accepted) return false;

    const location = assignDropLocation(player);

    if (!location) return false;

    if (!hasSignal(player, villagePos)) {

        player.playSound("mob.villager.no");

        player.sendMessage("§cNo signal. Move closer to the village bell.");

        return false;

    }

    player.playSound("random.orb");

    player.sendMessage("§7Searching secure signal...");

    system.runTimeout(() => {

        player.playSound("random.orb");

        player.sendMessage("§aSecure signal established.");

    }, 40);

    system.runTimeout(() => {

        player.sendMessage(
            `§e${order.buyer.name}:\n§f"${order.messages.location}"`
        );

    }, 60);

    system.runTimeout(() => {

        createDeadDrop(
            player,
            location.name,
            location.drop
        );

        spawnDeadDrop(player);

        player.sendMessage("§6Dead Drop Ready.");

    }, 80);

    return true;

}

// ========================================
// DELIVERY CHECK
// ========================================

export function checkDelivery(player, itemId, amount) {

    const order = getActiveOrder(player);

    if (!order) return false;

    if (!validateDelivery(player, itemId, amount)) {

        player.playSound("mob.villager.no");

        player.sendMessage("§cWrong item or amount.");

        return false;

    }

    rewardPlayer(player);

    player.playSound("random.pop");

    player.sendMessage(`§a+$${calculateReward(player)}`);

    player.sendMessage("§bReputation +2");

    player.sendMessage(

        `§7${order.buyer.name}: "${order.messages.completed}"`

    );

    removeDeadDrop(player);

    clearOrder(player);

    return true;

}

// ========================================
// ORDER EXPIRED
// ========================================

export function cancelExpiredOrder(player) {

    const order = getActiveOrder(player);

    if (!order) return;

    player.playSound("mob.villager.no");

    removeBuyerTrust(player);

    removeReputation(player, 2);

    player.sendMessage(

        `§c${order.buyer.name}: "${order.messages.failed}"`

    );

    removeDeadDrop(player);

    clearOrder(player);

}

// ========================================
// ORDER STATUS
// ========================================

export function isOrderAccepted(player) {

    const order = getActiveOrder(player);

    return order ? order.accepted : false;

}

export function isOrderCompleted(player) {

    const order = getActiveOrder(player);

    return order ? order.completed : false;

}

// ========================================
// DEBUG
// ========================================

export function resetOrders(player) {

    clearOrder(player);

    clearDrop(player);

    player.setDynamicProperty(
        "nirvana_wallet",
        0
    );

    player.setDynamicProperty(
        "nirvana_reputation",
        0
    );

}

// ========================================
// CONTINUE TO PART 6
// ========================================
// ========================================
// SETUP MODE
// ========================================

const SETUP_PROPERTY = "nirvana_setup_mode";

export function enableSetupMode(player) {

    player.setDynamicProperty(
        SETUP_PROPERTY,
        true
    );

    player.sendMessage("§aSetup Mode Enabled.");

}

export function disableSetupMode(player) {

    player.setDynamicProperty(
        SETUP_PROPERTY,
        false
    );

    player.sendMessage("§cSetup Mode Disabled.");

}

export function isSetupMode(player) {

    return player.getDynamicProperty(
        SETUP_PROPERTY
    ) === true;

}

// ========================================
// REGISTER BELL
// ========================================

export function registerSignal(player) {

    if (!isSetupMode(player)) return;

    const pos = player.location;

    player.setDynamicProperty(

        "nirvana_temp_signal",

        JSON.stringify({

            x: Math.floor(pos.x),
            y: Math.floor(pos.y),
            z: Math.floor(pos.z)

        })

    );

    player.playSound("random.orb");

    player.sendMessage("§aSignal position saved.");

}

// ========================================
// REGISTER DROP
// ========================================

export function registerDrop(player) {

    if (!isSetupMode(player)) return;

    const pos = player.location;

    player.setDynamicProperty(

        "nirvana_temp_drop",

        JSON.stringify({

            x: Math.floor(pos.x),
            y: Math.floor(pos.y),
            z: Math.floor(pos.z)

        })

    );

    player.playSound("random.orb");

    player.sendMessage("§aDead Drop position saved.");

}

// ========================================
// FINISH SETUP
// ========================================

export function finishVillageSetup(player, villageName) {

    const signal = player.getDynamicProperty(
        "nirvana_temp_signal"
    );

    const drop = player.getDynamicProperty(
        "nirvana_temp_drop"
    );

    if (!signal || !drop) {

        player.sendMessage(
            "§cSignal or Drop not registered."
        );

        return false;

    }

    const villages = loadVillageDatabase();

    villages.push({

        id: villageName
            .toLowerCase()
            .replaceAll(" ", "_"),

        name: villageName,

        signal: JSON.parse(signal),

        drop: JSON.parse(drop)

    });

    world.setDynamicProperty(

        "nirvana_villages",

        JSON.stringify(villages)

    );

    disableSetupMode(player);

    player.playSound("random.pop");

    player.sendMessage("§aVillage Registered!");

    return true;

}

// ========================================
// LOAD VILLAGES
// ========================================

export function loadVillageDatabase() {

    try {

        const raw = world.getDynamicProperty(
            "nirvana_villages"
        );

        if (!raw) return [];

        return JSON.parse(raw);

    }

    catch {

        return [];

    }

}

// ========================================
// RANDOM VILLAGE
// ========================================

export function getRandomVillage() {

    const villages = loadVillageDatabase();

    if (villages.length === 0)
        return null;

    return villages[
        randomInt(
            0,
            villages.length - 1
        )
    ];

}

// ========================================
// CLEANUP
// ========================================

export function cleanupPlayer(player){

    clearOrder(player);

    clearDrop(player);

}

// ========================================
// INIT
// ========================================

world.afterEvents.playerSpawn.subscribe((event)=>{

    const player = event.player;

    if(!getActiveOrder(player))
        return;

    player.sendMessage(
        "§eYou still have an active order."
    );

});