/** @odoo-module **/
import {registry, bus, services } from '@web/core/registry';
const { Component, useState, onWillStart } = owl;
import { useService } from "@web/core/utils/hooks";
import { hooks } from '@odoo/owl';
import { useModel } from '@odoo/owl';


export class OrderReceiving extends Component {

    setup() {
        this.orm = useService("orm");
        this.state = useState({
            machines:[],
            machineType:[],
            paramFields:[],
            recipeFields:[],
            orderDetailsFields:[],
            orderData:[],
            machineRoutingData:[],
            paramRecipe:[],
            reprocessOrders:[],
            fabricRequestStatus:{},
        });

        onWillStart(async () => {
            this.state.paramFields = await this.fetchModelFields();
            this.state.recipeFields = await this.fetchRecipeFields();
            this.state.orderDetailsFields = await this.fetchOrderDetailsFields();
            await this.getData();

            await this.getParamRecipeData();
            await this.checkReprocessOrders();
            await this.fabricRequestStatus();

            console.log("this.state.paramRecipe : ", this.state.paramRecipe);

            this.inputValuesStore = new Map(); // Create the input values store
            this.inputValuesRecipe = new Map(); // Create the input values store

        });
        this.state.notification =useService("notification");
        this.getParamRecipeData = this.getParamRecipeData.bind(this);
        this.addOrder = this.addOrder.bind(this);
        this.requestFabric = this.requestFabric.bind(this);
        this.fabricRequestStatus = this.fabricRequestStatus.bind(this);
    }

    async checkReprocessOrders() {
        try {
            // Fetch user IDs belonging to the 'Bleaching Manager' group
            const bleachingManagerGroup = await this.orm.searchRead('res.groups', [['name', '=', 'Bleaching Supervisor']], ['id']);
            const bleachingManagerGroupID = bleachingManagerGroup[0]?.id || null;

            if (bleachingManagerGroupID === null) {
                console.log("Bleaching Manager group not found.");
                return;
            }

            // Fetch user IDs belonging to the 'Bleaching Manager' group
            const usersInBleachingManagerGroup = await this.orm.searchRead('res.users', [['groups_id', '=', bleachingManagerGroupID]], ['id']);

            // Fetch orders that match the specified conditions and were last edited by users in the 'Bleaching Manager' group
            const reprocessOrders = await this.orm.searchRead(
                'order.data',
                [['status', '=', 'Bleaching Manager Approved'], ['reprocess', '=', true], ['write_uid', 'in', usersInBleachingManagerGroup.map(user => user.id)]],
                ['ppLot', 'id']
            );

            console.log('Reprocess orders:', reprocessOrders);
            this.state.reprocessOrders = reprocessOrders;

            // You can further process the reprocessOrders here
        } catch (error) {
            console.error('Error while checking reprocess orders:', error);
        }
    }

    async getParamRecipeData() {
        const paramRecipe = {};

        for (const order of this.state.orderData) {
            const orderId = order.ID;
            paramRecipe[orderId] = []; // Create an empty array for each orderId
            const matchingMachineRoutingData = this.state.machineRoutingData[orderId];
            if (matchingMachineRoutingData) {
                for (const machineData of matchingMachineRoutingData.machineRoutingData) {
                    const { machine_type_id, machineId, machine_name } = machineData;
                    const matchingMachineType = this.state.machineType.find(type => type.id === machine_type_id);
                    // Process machineParams string and create an array of parameter names
                    const machineParamsArray = matchingMachineType.machineParams.split(',').map(param => param.trim());
                    // Process machineRecipes string and create an array of recipe names
                    const machineRecipesArray = matchingMachineType.machineRecipes.split(',').map(recipe => recipe.trim());

                    // Fetch the common param_id for the machine_params
                    const paramData = await this.orm.searchRead("bleaching.machines.params", [
                        ["orderId", "=", orderId],
                        ["machineId", "=", machineId]
                    ], ["id"]);

                    const paramIdValue = paramData[0]?.id || '';

                    // Create 'machine_params' array using 'machineParamsArray' elements and adding 'param_value'
                    const machine_params = await Promise.all(machineParamsArray.map(async paramName => {
                        const paramField = this.state.paramFields[paramName];
                        const paramData = await this.orm.searchRead("bleaching.machines.params", [
                            ["orderId", "=", orderId],
                            ["machineId", "=", machineId]
                        ], [paramName]);
                        const paramValue = paramData[0]?.[paramName] || '';

                        return {
                            name: paramName,
                            param_name: paramField?.string || '',
                            param_type: paramField?.type || '',
                            param_value: paramValue
                        };
                    }));

                    const recipeData = await this.orm.searchRead("bleaching.machines.recipe", [
                            ["orderId", "=", orderId],
                            ["machineId", "=", machineId]
                        ], ["id"]);

                    const recipeIdValue = recipeData[0]?.id || '';

                    // Create 'machine_recipes' array using 'machineRecipesArray' elements
                    const machine_recipes = await Promise.all(machineRecipesArray.map(async recipeName => {
                        const recipeField = this.state.recipeFields[recipeName];
                        const recipeData = await this.orm.searchRead("bleaching.machines.recipe", [
                            ["orderId", "=", orderId],
                            ["machineId", "=", machineId]
                        ], [recipeName]);
                        const recipeValue = recipeData[0]?.[recipeName] || '';

                        return {
                            name: recipeName,
                            recipe_name: recipeField?.string || '',
                            recipe_type: recipeField?.type || '',
                            recipe_value: recipeValue,
                        };
                    }));
                    paramRecipe[orderId].push({
                        machine_type_id,
                        machine_id: machineId,
                        machine_name,
                        machine_params,
                        machine_recipes,
                        param_id: paramIdValue, // Add param_id to the machine data
                        recipe_id: recipeIdValue
                    });
                }
            }
        }
        // Now each inside object will have an array with objects containing 'machine_type_id', 'machine_id', 'machine_name', 'machine_params', 'machine_recipes', and 'param_id'
        this.state.paramRecipe = paramRecipe;
    }

    async getData() {
        this.state.machines = await this.orm.searchRead("bleaching.machines", [], ["id", "machine_name", "machine_type", "underMaintenance"]);
        this.state.machineType = await this.orm.searchRead("bleaching_machine.types", [], ["id", "machine_type_name", "machineParams", "machineRecipes"]);

        const includedFields = ['id', 'ppLot', 'urgencyStatus', 'placement_date', 'dispatch_date'];
        this.state.orderDetailsFields = await this.fetchOrderDetailsFields();

        console.log('this.state.orderDetailsFields : ', this.state.orderDetailsFields);

        const filteredFields = Object.keys(this.state.orderDetailsFields)
            .filter(fieldName => includedFields.includes(fieldName))
            .map(fieldName => ({
                name: fieldName,
                actualName: this.state.orderDetailsFields[fieldName].string,
                type: this.state.orderDetailsFields[fieldName].type,
            }));

        console.log('filteredFields: ', filteredFields);
        this.state.orderDetailsFields = filteredFields;

        const status = 'WIP';
        const orderDetailsSelectedFields = this.state.orderDetailsFields.map(field => field.name);

        console.log('orderDetailsSelectedFields : ', orderDetailsSelectedFields);

        this.state.orderData = await this.orm.searchRead("order.data", [["status", "=", status]], orderDetailsSelectedFields);

        console.log('this.state.orderData : ', this.state.orderData)

        const machineRoutingDetails = {}; // Object to store machine routing data

        for (const order of this.state.orderData) {
            // Iterate through the properties of the order object
            for (const key in order) {
                if (Object.hasOwnProperty.call(order, key)) {
                    // Find the matching field in orderDetailsFields
                    const matchingField = this.state.orderDetailsFields.find(field => field.name === key);
                    if (matchingField) {
                        // Replace the key with actualName from orderDetailsFields
                        order[matchingField.actualName] = order[key];
                        delete order[key]; // Remove the old key
                    }
                }
            }
            const orderId = order.ID; // Use the actual property name from your data
            // Fetch the matching records from the 'machine.routing' table based on orderId
            const machineRoutingData = await this.orm.searchRead(
                "machine.routing",
                [["orderId", "=", orderId]],
                ["machineId", "delay", "route_name", "orderId"]
            );

            console.log('machineRoutingData :' , machineRoutingData);
                // Enhance machineRoutingData with machine details
            let machineRouteString = "";



            for (const [index, machineRoute] of machineRoutingData.entries()) {
                const machineId = machineRoute.machineId;
                // Find the machine with matching id from state.machines
                const matchingMachine = this.state.machines.find(machine => machine.id === machineId);
                if (matchingMachine) {
                    machineRoute.machine_name = matchingMachine.machine_name;
                    const machineType = matchingMachine.machine_type;
                    machineRoute.machine_type_id = machineType[0];
                    machineRoute.machine_type_name = machineType[1];

                    if (index > 0) {
                        machineRouteString += " --> ";
                    }
                    machineRouteString += machineRoute.machine_name;
                    if (machineRoute.delay > 0) {
                        machineRouteString += ` --> (${machineRoute.delay}-Hours Delay)`;
                    }
                }
            }

            console.log('machineRouteString : ', machineRouteString);

            machineRoutingDetails[orderId] = {
                machineRoutingData: machineRoutingData,
                machineRouteString: machineRouteString
            };
        }
        this.state.machineRoutingData = machineRoutingDetails;

        console.log('this.state.machineRoutingData : ', this.state.machineRoutingData);
    }

    updateInputValue(paramName, param) {
        return function(event) {
            const inputValue = event.target.value;
            this.inputValuesStore.set(paramName, inputValue); // Store input value in the virtual store
        };
    }

    updateParams(machineId, paramId, orderId, machineParams) {
        const updateHandler = async (event) => {
            console.log('Param ID:', paramId);
            console.log('machineParams : ', machineParams);
            const updateData = {};

            // If paramId is null or empty, create a new row with orderId and machineId
            if (!paramId) {
                const createData = [{
                    orderId: orderId,
                    machineId: machineId,
                    ...Object.fromEntries(this.inputValuesStore), // Store all input values in the create data
                }];

                try {
                    // Create new records using your ORM's create function
                    const createResult = await this.orm.create("bleaching.machines.params", createData);
                    console.log('Create Result:', createResult);
                } catch (error) {
                    console.error('Create Error:', error);
                }
            } else {
                for (const param of machineParams) {
                    const storedValue = this.inputValuesStore.get(param.name); // Retrieve stored input value
                    updateData[param.name] = storedValue !== undefined ? storedValue : param.param_value;
                }

                try {
                    // Update the database record using your ORM's write function
                    const writeResult = await this.orm.write("bleaching.machines.params", [paramId], updateData);
                    console.log('Write Result:', writeResult);
                } catch (error) {
                    console.error('Write Error:', error);
                }
            }
        };
        return updateHandler;
    }


    updateRecipeValue(recipeName, recipe) {
        return function(event) {
            const inputValue = event.target.value;
            console.log('inputValue : ', inputValue);
            this.inputValuesRecipe.set(recipeName,inputValue) // Update recipe_value directly
        };
    }

    updateRecipe(machineId, recipeId, orderId, machineRecipes) {
        const updateHandler = async (event) => {
            console.log('recipe ID:', recipeId);
            console.log('machineRecipes : ', machineRecipes);
            const updateData = {};

            // If paramId is null or empty, create a new row with orderId and machineId
            if (!recipeId) {
                const createData = [{
                    orderId: orderId,
                    machineId: machineId,
                    ...Object.fromEntries(this.inputValuesRecipe), // Store all input values in the create data
                }];

                try {
                    // Create new records using your ORM's create function
                    const createResult = await this.orm.create("bleaching.machines.recipe", createData);
                    console.log('Create Result:', createResult);
                } catch (error) {
                    console.error('Create Error:', error);
                }
            } else {
                for (const recipe of machineRecipes) {
                    const storedValue = this.inputValuesRecipe.get(recipe.name); // Retrieve stored input value
                    updateData[recipe.name] = storedValue !== undefined ? storedValue : recipe.recipe_value;
                }

                try {
                    // Update the database record using your ORM's write function
                    const writeResult = await this.orm.write("bleaching.machines.recipe", [recipeId], updateData);
                    console.log('Write Result:', writeResult);
                } catch (error) {
                    console.error('Write Error:', error);
                }
            }
        };
        return updateHandler;
    }

    redirectToSetRouteScreen(ev) {
        const selectedIdForRoute = ev.target.getAttribute('data-machine-id');
        console.log("Selected Id from Sending Page: ", selectedIdForRoute)
        const url = new URL("/web#action=bleaching_dept.machine_route_js", window.location.origin);
        url.searchParams.set("selectedIdForRoute", selectedIdForRoute);
        window.location.href = url.toString();
    }

    async fetchModelFields() {
        const response = await fetch('/api/params_fields/get_model_fields', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        const result = await response.json();
        return result.fields;
    }

    async fetchRecipeFields() {
        const response = await fetch('/api/recipe_fields/get_model_fields', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        const result = await response.json();
        return result.fields;
    }

    async fetchOrderDetailsFields() {
        const response = await fetch('/api/ppc_order_view/get_model_fields', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        const result = await response.json();
        return result.fields;
    }

    generateRandomNumber() {
        const randomNum = Math.floor(Math.random() * 1000000000);
        return randomNum;
    }

    async addOrder(orderId) {
        const writeResult = await this.orm.write('order.data', [orderId], { status: 'WIP' });

        this.state.notification.add('Order Added.', {
            title: 'Success',
            type: 'success',
        });
        setTimeout(() => {
            window.location.reload();
        }, 700);
    }

//    async fabricRequestStatus() {
//        for (const orderRecord of this.state.orderData) {
//            const orderId = orderRecord['ID'];
//            const issuanceRequest = await this.orm.searchRead("fabric.issuance.request", [["orderId", "=", orderId]], ["status", "orderId", "ppLot", "quantity", "remarks"]);
//
//            console.log('issuanceRequest : ', issuanceRequest);
//            if (issuanceRequest && issuanceRequest.length > 0) {
//                const status = issuanceRequest[0].status;
//                console.log(`Order ID: ${orderId}, Status: ${status}`);
//            } else {
//                console.log(`No matching record found for Order ID: ${orderId}`);
//            }
//        }
//    }



//async fabricRequestStatus() {
//    const fabricRequestStatus = {}; // Initialize an empty object to store the data
//
//    for (const orderRecord of this.state.orderData) {
//        const orderId = orderRecord['ID'];
//        const issuanceRequest = await this.orm.searchRead("fabric.issuance.request", [["orderId", "=", orderId]], ["status", "orderId", "ppLot", "quantity", "remarks"]);
//
//        console.log('issuanceRequest : ', issuanceRequest);
//
//        if (issuanceRequest && issuanceRequest.length > 0) {
//            const status = issuanceRequest[0].status;
//            console.log(`Order ID: ${orderId}, Status: ${status}`);
//
//            // Create a nested object with issuanceRequest data under orderId key
//            fabricRequestStatus[orderId] = issuanceRequest[0];
//        } else {
//            console.log(`No matching record found for Order ID: ${orderId}`);
//        }
//    }
//    // Update state.fabricRequestStatus with the nested objects
//    this.state.fabricRequestStatus = fabricRequestStatus;
//    console.log('this.state.fabricRequestStatus : ', this.state.fabricRequestStatus);
//}




    async fabricRequestStatus() {
        const fabricRequestStatus = {}; // Initialize an empty object to store the data

        for (const orderRecord of this.state.orderData) {
            const orderId = orderRecord['ID'];
            const ppLot = orderRecord['PP Lot Number'];

            // Initialize the default values
            const defaultValues = {
                status: 'Draft',
                quantity: 0,
                remarks: 'Nill',
            };

            // Create an object with default values
            fabricRequestStatus[orderId] = {
                orderId,
                ppLot,
                ...defaultValues,
            };

            const issuanceRequest = await this.orm.searchRead(
                "fabric.issuance.request",
                [["orderId", "=", orderId]],
                ["status", "quantity", "remarks"]
            );

            console.log('issuanceRequest : ', issuanceRequest);

            if (issuanceRequest && issuanceRequest.length > 0) {
                // If status, quantity, and remarks are available in issuanceRequest, update the values
                if (issuanceRequest[0].status) {
                    fabricRequestStatus[orderId].status = issuanceRequest[0].status;
                }
                if (issuanceRequest[0].quantity) {
                    fabricRequestStatus[orderId].quantity = issuanceRequest[0].quantity;
                }
                if (issuanceRequest[0].remarks) {
                    fabricRequestStatus[orderId].remarks = issuanceRequest[0].remarks;
                }

                console.log(`Order ID: ${orderId}, Status: ${fabricRequestStatus[orderId].status}`);
            } else {
                console.log(`No matching record found for Order ID: ${orderId}`);
            }
        }

        // Update state.fabricRequestStatus with the updated objects
        this.state.fabricRequestStatus = fabricRequestStatus;
        console.log('this.state.fabricRequestStatus : ', this.state.fabricRequestStatus);
    }

    async requestFabric(ppLot, orderId, quantity, remarks) {
        var orderData = await this.orm.searchRead("order.data", [["id", "=", orderId]], ["fabricType", "greyLotNumber"]);
        console.log('orderData : ', orderData);
        console.log('orderData[id] : ', orderData);

        var quantityValue = document.getElementById('quantity').value;
        var remarksValue = document.getElementById('remarks').value;
        console.log('ppLot : ', ppLot, 'orderId :', orderId, 'quantity : ', quantityValue);

        const createData = [{
            orderId: orderId,
            ppLot: ppLot,
            quantity: quantityValue,
            remarks: remarksValue,
            status: 'Submitted',
            requestedFabricType: orderData[0].fabricType,
            greigeLotNumber: orderData[0].greyLotNumber,
        }];
        console.log('createData : ', createData);
        try {
            const createResult = await this.orm.create("fabric.issuance.request", createData);
            console.log('Create Result:', createResult);
            this.state.notification.add('Order Added.', {
                title: 'Success',
                type: 'success',
            });
            setTimeout(() => {
                window.location.reload();
            }, 300);
            } catch (error) {
                console.error('Create Error:', error);
            }
            console.log('this.state.fabricRequestStatus : ', this.state.fabricRequestStatus);
    }
}
OrderReceiving.template = 'bleaching_dept.receivingTemplate';
registry.category('actions').add('bleaching_dept.order_receiving_js', OrderReceiving);



//setup() {
//        this.orm = useService("orm");
//        this.state = useState({
//            machines:[],
//            machineType:[],
//            paramFields:[],
//            recipeFields:[],
//            orderDetailsFields:[],
//            orderData:[],
//            machineRoutingData:[],
//            paramRecipe:[],
//            reprocessOrders:[],
//        });
//
//        const loadData = async () => {
//            this.state.paramFields = await this.fetchModelFields();
//            this.state.recipeFields = await this.fetchRecipeFields();
//            this.state.orderDetailsFields = await this.fetchOrderDetailsFields();
//            await this.getData();
//            await this.getParamRecipeData();
//            await this.checkReprocessOrders();
//            console.log("this.state.paramRecipe : ", this.state.paramRecipe);
//
//        };
//
//        onWillStart(() => {
//            return loadData();
//        });
//
//        this.state.notification = useService("notification");
//        this.getParamRecipeData = this.getParamRecipeData.bind(this);
//        this.addOrder = this.addOrder.bind(this);
//    }


// Perfect working
//    updateParams(machineId, paramId, orderId, machineParams) {
//        const updateHandler = async (event) => {
//            console.log('Param ID:', paramId);
//            console.log('machineParams : ', machineParams);
//            const updateData = {};
//            for (const param of machineParams) {
//                const storedValue = this.inputValuesStore.get(param.name); // Retrieve stored input value
//                updateData[param.name] = storedValue !== undefined ? storedValue : param.param_value;
//            }
//            console.log('updateData : ', updateData);
//            try {
//                // Update the database record using your ORM's write function
//                const writeResult = await this.orm.write("bleaching.machines.params", [paramId], updateData);
//                console.log('Write Result:', writeResult);
//            } catch (error) {
//                console.error('Write Error:', error);
//            }
//        };
//        return updateHandler;
//    }
