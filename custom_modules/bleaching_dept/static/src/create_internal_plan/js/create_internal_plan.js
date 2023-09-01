/** @odoo-module **/
import {registry, bus, services } from '@web/core/registry';
const { Component, useState, onWillStart } = owl;
import { useService } from "@web/core/utils/hooks";
import { hooks } from '@odoo/owl';
import { useModel } from '@odoo/owl';

export class CreateInternalPlan extends Component {
    setup() {
        this.orm = useService("orm");
        this.state = useState({
            machines:[],
            orders:[],
            reprocessOrders:[],
            internalPlanOrders : [],
            machineRout:[],
            formattedMachineRoute:[],
        });
        onWillStart(async () => {
            this.state.machineRout = await this.orm.searchRead("order.data", [], ["id", "machineRoute"]);
            this.state.orders = await this.orm.searchRead('order.data', [['status', '=', 'Bleaching Manager Approved'],['reprocess', '=', false]], ['ppLot', 'id']);
//            this.state.reprocessOrders = await this.orm.searchRead('order.data', [['status', '=', 'Bleaching Manager Approved'],['reprocess', '=', true]], ['ppLot', 'id']);
            this.state.internalPlanOrders = await this.orm.searchRead('order.data', [['status', '=', 'Added To Internal Plan']], ['ppLot', 'id', "machineRoute", 'jobCard']);
            this.state.formattedMachineRoute = await this.orm.searchRead("machine.routing", [], ['machineId', 'delay', 'route_name', 'orderId']);
            this.state.machines = await this.orm.searchRead("bleaching.machines", [], ["id", "machine_name", "machine_type", "underMaintenance"]);


            console.log('this.state.machineRout : ', this.state.machineRout);
            console.log('this.state.internalPlanOrders : ', this.state.internalPlanOrders);
            console.log('this.state.machines : ', this.state.machines);

            await this.checkOrdersWithMachineRoute();
            await this.checkReprocessOrders();
        });
        this.state.notification =useService("notification");
        this.addOrder = this.addOrder.bind(this);
        this.loadInternalOrders = this.loadInternalOrders.bind(this);
        this.redirectToSetParamsScreen = this.redirectToSetParamsScreen.bind(this);
        this.checkOrdersWithMachineRoute = this.checkOrdersWithMachineRoute.bind(this);
        this.typingCompleted = this.typingCompleted.bind(this);
        this.approveOrder = this.approveOrder.bind(this);
    }

    async checkReprocessOrders() {
        try {
            // Fetch user IDs belonging to the 'Bleaching Manager' group
            const bleachingManagerGroup = await this.orm.searchRead('res.groups', [['name', '=', 'Bleaching Manager']], ['id']);
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



    async addOrder(orderId) {
        const writeResult = await this.orm.write('order.data', [orderId], { status: 'Added To Internal Plan' });
        // Fetch the updated order data and realign the table
        const orderData = await this.orm.searchRead('order.data', [['status', '=', 'Bleaching Manager Approved']], ['ppLot', 'id']);
        this.state.reprocessOrders = await this.orm.searchRead('order.data', [['status', '=', 'Bleaching Manager Approved'],['reprocess', '=', true]], ['ppLot', 'id']);

        this.state.orders = orderData;
        this.state.notification.add('Order Added.', {
            title: 'Success',
            type: 'success',
        });

        await this.loadInternalOrders();
        await this.checkOrdersWithMachineRoute();
    }



    async loadInternalOrders(){
        this.state.internalPlanOrders = await this.orm.searchRead('order.data', [['status', '=', 'Added To Internal Plan']], ['ppLot', 'id']);
        console.log('this.state.internalPlanOrders : ', this.state.internalPlanOrders);
    }

    redirectToSetParamsScreen(ev) {
        const selectedIdForRoute = ev.target.getAttribute('data-machine-id');
        console.log("Selected Id from Sending Page: ", selectedIdForRoute)
        const url = new URL("/web#action=bleaching_dept.machine_params_js", window.location.origin);
        url.searchParams.set("selectedIdForRoute", selectedIdForRoute);
        window.location.href = url.toString();
    }

    redirectToSetRouteScreen(ev) {
        const selectedIdForRoute = ev.target.getAttribute('data-machine-id');
        console.log("Selected Id from Sending Page: ", selectedIdForRoute)
        const url = new URL("/web#action=bleaching_dept.machine_route_js", window.location.origin);
        url.searchParams.set("selectedIdForRoute", selectedIdForRoute);
        window.location.href = url.toString();
    }

    formatMachineRoute(orderId) {
        const filteredRoutes = this.state.formattedMachineRoute.filter(route => route.orderId === orderId);
        if (filteredRoutes.length > 0) {
            // Create a new array with machine names and delays (if applicable)
            const machineNamesArray = filteredRoutes.map(route => {
                const matchingMachine = this.state.machines.find(machine => machine.id === route.machineId);
                const machineName = matchingMachine ? matchingMachine.machine_name : '';
                const delay = route.delay !== 0 ? `(${route.delay}-Hours Delay)` : '';
                return delay ? `${machineName} --> ${delay}` : machineName;
            });
            const machineNamesString = machineNamesArray.join(' --> ');

            // Returning the machine names string
            return machineNamesString;
        } else {
            return 'No Route Found.';
        }
    }

//    async checkOrdersWithMachineRoute() {
//        try {
//            const ordersWithMachineRoute = await this.orm.searchRead(
//                'order.data',
//                [['status', '=', 'Added To Internal Plan']],
//                ['id', 'ppLot', 'machineRoute', 'jobCard', 'reprocess']
//            );
//            const machines = await this.orm.searchRead('bleaching.machines',[],['id', 'machine_name']);
//            const ordersInfoWithMachineRoute = ordersWithMachineRoute.map(order => ({
//                id: order.id,
//                machineRoute: order.machineRoute ? order.machineRoute.split(',').map(route => route.trim()) : [],
//                ppLot:order.ppLot,
//                jobCard:order.jobCard,
//                reprocess:order.reprocess,
//            }));
//            ordersInfoWithMachineRoute.forEach(order => {
//                order.machineRoute = order.machineRoute.map(route => {
//                    const matchingMachine = machines.find(machine => machine.id === parseInt(route));
//                    return matchingMachine ? matchingMachine.machine_name : route;
//                });
//            });
//            this.state.internalPlanOrders = ordersInfoWithMachineRoute
//            console.log('Orders with internalPlanOrders:', this.state.internalPlanOrders);
//        } catch (error) {
//            console.error('Error while checking orders with machineRoute:', error);
//        }
//    }




//    async checkOrdersWithMachineRoute() {
//        try {
//            const ordersWithMachineRoute = await this.orm.searchRead(
//                'order.data',
//                [['status', '=', 'Added To Internal Plan']],
//                ['id', 'ppLot', 'machineRoute', 'jobCard', 'reprocess', 'write_uid']
//            );
//            const machines = await this.orm.searchRead('bleaching.machines', [], ['id', 'machine_name']);
//            console.log('ordersWithMachineRoute: ', ordersWithMachineRoute);
//
//            // Fetch user IDs from 'write_uid' field
//            const userIDs = ordersWithMachineRoute.map(order => order.write_uid[0]).filter(Boolean);
//
//            // Fetch user records for the retrieved user IDs
//            const userRecords = await this.orm.searchRead('res.users', [['id', 'in', userIDs]], ['id', 'name']);
//
//            const userMap = {};
//            userRecords.forEach(user => {
//                userMap[user.id] = user.name;
//            });
//
//            const ordersInfoWithMachineRoute = ordersWithMachineRoute.map(order => {
//                const user_id = order.write_uid[0]; // Get the user ID from the 'write_uid' field
//                return {
//                    id: order.id,
//                    machineRoute: order.machineRoute ? order.machineRoute.split(',').map(route => route.trim()) : [],
//                    ppLot: order.ppLot,
//                    jobCard: order.jobCard,
//                    reprocess: order.reprocess,
//                    lastUpdatedBy: userMap[user_id] || null // Get user name from userMap using user_id
//                };
//            });
//
//            ordersInfoWithMachineRoute.forEach(order => {
//                order.machineRoute = order.machineRoute.map(route => {
//                    const matchingMachine = machines.find(machine => machine.id === parseInt(route));
//                    return matchingMachine ? matchingMachine.machine_name : route;
//                });
//            });
//
//            this.state.internalPlanOrders = ordersInfoWithMachineRoute;
//            console.log('Orders with internalPlanOrders:', this.state.internalPlanOrders);
//        } catch (error) {
//            console.error('Error while checking orders with machineRoute:', error);
//        }
//    }



//    async checkOrdersWithMachineRoute() {
//        try {
//            const ordersWithMachineRoute = await this.orm.searchRead(
//                'order.data',
//                [['status', '=', 'Added To Internal Plan']],
//                ['id', 'ppLot', 'machineRoute', 'jobCard', 'reprocess', 'write_uid']
//            );
//            const machines = await this.orm.searchRead('bleaching.machines', [], ['id', 'machine_name']);
//            console.log('ordersWithMachineRoute: ', ordersWithMachineRoute);
//
//            // Fetch user IDs from 'write_uid' field
//            const userIDs = ordersWithMachineRoute.map(order => order.write_uid[0]).filter(Boolean);
//
//            // Fetch user records for the retrieved user IDs
//            const userRecords = await this.orm.searchRead('res.users', [['id', 'in', userIDs]], ['id', 'name', 'groups_id']);
//            console.log('userRecords: ', userRecords);
//
//            const userMap = {};
//            userRecords.forEach(user => {
//                const groupNames = user.groups_id.map(groupTuple => groupTuple[1]);
//                console.log('user:', user);
//                console.log('groupNames:', groupNames);
//                userMap[user.id] = {
//                    name: user.name,
//                    groups: groupNames
//                };
//            });
//
//            const ordersInfoWithMachineRoute = ordersWithMachineRoute.map(order => {
//                const user_id = order.write_uid[0]; // Get the user ID from the 'write_uid' field
//                const userData = userMap[user_id] || {};
//                console.log('userData:', userData); // Add this line for debugging
//                return {
//                    id: order.id,
//                    machineRoute: order.machineRoute ? order.machineRoute.split(',').map(route => route.trim()) : [],
//                    ppLot: order.ppLot,
//                    jobCard: order.jobCard,
//                    reprocess: order.reprocess,
//                    lastUpdatedBy: userData.name || null, // Get user name from userMap using user_id
//                    userGroups: userData.groups || [] // Get user groups from userMap using user_id
//                };
//            });
//
//            console.log('ordersInfoWithMachineRoute:', ordersInfoWithMachineRoute);
//
//            ordersInfoWithMachineRoute.forEach(order => {
//                order.machineRoute = order.machineRoute.map(route => {
//                    const matchingMachine = machines.find(machine => machine.id === parseInt(route));
//                    return matchingMachine ? matchingMachine.machine_name : route;
//                });
//            });
//
//            this.state.internalPlanOrders = ordersInfoWithMachineRoute;
//            console.log('Orders with internalPlanOrders:', this.state.internalPlanOrders);
//        } catch (error) {
//            console.error('Error while checking orders with machineRoute:', error);
//        }
//    }

    async checkOrdersWithMachineRoute() {
        try {
            const ordersWithMachineRoute = await this.orm.searchRead(
                'order.data',
                [['status', '=', 'Added To Internal Plan']],
                ['id', 'ppLot', 'machineRoute', 'jobCard', 'reprocess', 'write_uid']
            );
            const machines = await this.orm.searchRead('bleaching.machines', [], ['id', 'machine_name']);

            // Fetch user IDs from 'write_uid' field
            const userIDs = ordersWithMachineRoute.map(order => order.write_uid[0]).filter(Boolean);

            // Fetch user records for the retrieved user IDs
            const userRecords = await this.orm.searchRead('res.users', [['id', 'in', userIDs]], ['id', 'name', 'groups_id']);

            const allGroupRecords = await this.orm.searchRead('res.groups', [], ['id', 'name']);

            const userMap = {};
            userRecords.forEach(user => {
                const groupNames = user.groups_id.map(groupID => {
                    const matchingGroup = allGroupRecords.find(group => group.id === groupID);
                    return matchingGroup ? matchingGroup.name : undefined;
                });
                userMap[user.id] = {
                    name: user.name,
                    groups: groupNames,
                };
            });

            const ordersInfoWithMachineRoute = ordersWithMachineRoute.map(order => {
                const user_id = order.write_uid[0]; // Get the user ID from the 'write_uid' field
                const userData = userMap[user_id] || {};
                return {
                    id: order.id,
                    machineRoute: order.machineRoute ? order.machineRoute.split(',').map(route => route.trim()) : [],
                    ppLot: order.ppLot,
                    jobCard: order.jobCard,
                    reprocess: order.reprocess,
                    lastUpdatedBy: userData.name || null, // Get user name from userMap using user_id
                    userGroups: userData.groups || [] // Get user groups from userMap using user_id
                };
            });

            ordersInfoWithMachineRoute.forEach(order => {
                order.machineRoute = order.machineRoute.map(route => {
                    const matchingMachine = machines.find(machine => machine.id === parseInt(route));
                    return matchingMachine ? matchingMachine.machine_name : route;
                });
            });

            this.state.internalPlanOrders = ordersInfoWithMachineRoute;
            console.log('Orders with internalPlanOrders:', this.state.internalPlanOrders);
        } catch (error) {
            console.error('Error while checking orders with machineRoute:', error);
        }
    }

    async loadInternalOrders(){
        this.state.internalPlanOrders = await this.orm.searchRead('order.data', [['status', '=', 'Added To Internal Plan']], ['ppLot', 'id', 'machineRoute', 'reprocess']);
        console.log('this.state.internalPlanOrders : ', this.state.internalPlanOrders);
        await this.checkOrdersWithMachineRoute();
    }

    redirectToOrderSelectionScreen() {
        window.location.href = "/web#action=bleaching_dept.order_selection_js";
    }

    redirectToBleachingMachineStatusScreen() {
        window.location.href = "/web#action=bleaching_dept.machine_status_js";
    }

    async typingCompleted(orderId, event) {
        const updatedInput = event.target.value;

        try {
            const writeResult = await this.orm.write('order.data', [orderId], { jobCard: updatedInput });
        if (writeResult) {
            console.log('Job Card Number updated successfully');
        } else {
            console.error('Error occurred while updating Job Card Number');
        }
        } catch (error) {
            console.error('Error occurred during API call:', error);
        }
    }

    async approveOrder(orderId) {
        const writeResult = await this.orm.write('order.data', [orderId], { status: 'Bleaching Manager Finalized Plan' });
        await this.loadInternalOrders();
        this.state.notification.add('Order Added.', {
            title: 'Success',
            type: 'success',
        });
    }


}

CreateInternalPlan.template = 'bleaching_dept.createInternalPlanTemplate';
registry.category('actions').add('bleaching_dept.create_internal_plan_js', CreateInternalPlan);