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
            internalPlanOrders : [],
            machineRout:[],
            formattedMachineRoute:[],
        });
        onWillStart(async () => {
            this.state.machineRout = await this.orm.searchRead("order.data", [], ["id", "machineRoute"]);
            this.state.orders = await this.orm.searchRead('order.data', [['status', '=', 'Bleaching Manager Approved']], ['ppLot', 'id']);
            this.state.internalPlanOrders = await this.orm.searchRead('order.data', [['status', '=', 'Added To Internal Plan']], ['ppLot', 'id', "machineRoute"]);
            this.state.formattedMachineRoute = await this.orm.searchRead("machine.routing", [], ['machineId', 'delay', 'route_name', 'orderId']);
            this.state.machines = await this.orm.searchRead("bleaching.machines", [], ["id", "machine_name", "machine_type", "underMaintenance"]);


            console.log('this.state.machineRout : ', this.state.machineRout);
            console.log('this.state.internalPlanOrders : ', this.state.internalPlanOrders);
            console.log('this.state.machines : ', this.state.machines);

            await this.checkOrdersWithMachineRoute();
        });
        this.state.notification =useService("notification");
        this.addOrder = this.addOrder.bind(this);
        this.loadInternalOrders = this.loadInternalOrders.bind(this);
        this.redirectToSetParamsScreen = this.redirectToSetParamsScreen.bind(this);
        this.checkOrdersWithMachineRoute = this.checkOrdersWithMachineRoute.bind(this);
    }

    async addOrder(orderId) {
        const writeResult = await this.orm.write('order.data', [orderId], { status: 'Added To Internal Plan' });
        // Fetch the updated order data and realign the table
        const orderData = await this.orm.searchRead('order.data', [['status', '=', 'Bleaching Manager Approved']], ['ppLot', 'id']);
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

    async checkOrdersWithMachineRoute() {
        try {
            const ordersWithMachineRoute = await this.orm.searchRead(
                'order.data',
                [['status', '=', 'Added To Internal Plan']],
                ['id', 'ppLot', 'machineRoute']
            );
            const machines = await this.orm.searchRead('bleaching.machines',[],['id', 'machine_name']);
            const ordersInfoWithMachineRoute = ordersWithMachineRoute.map(order => ({
                id: order.id,
                machineRoute: order.machineRoute ? order.machineRoute.split(',').map(route => route.trim()) : [],
                ppLot:order.ppLot,
            }));
            // Modify 'machineRoute' to replace IDs with machine names
            ordersInfoWithMachineRoute.forEach(order => {
                order.machineRoute = order.machineRoute.map(route => {
                    const matchingMachine = machines.find(machine => machine.id === parseInt(route));
                    return matchingMachine ? matchingMachine.machine_name : route;
                });
            });
            this.state.internalPlanOrders = ordersInfoWithMachineRoute
            console.log('Orders with internalPlanOrders:', this.state.internalPlanOrders);
        } catch (error) {
            console.error('Error while checking orders with machineRoute:', error);
        }
    }

    async loadInternalOrders(){
        this.state.internalPlanOrders = await this.orm.searchRead('order.data', [['status', '=', 'Added To Internal Plan']], ['ppLot', 'id', 'machineRoute']);
        console.log('this.state.internalPlanOrders : ', this.state.internalPlanOrders);
        await this.checkOrdersWithMachineRoute();
    }

    redirectToOrderSelectionScreen() {
        window.location.href = "/web#action=bleaching_dept.order_selection_js";
    }
    redirectToBleachingMachineStatusScreen() {
        window.location.href = "/web#action=bleaching_dept.machine_status_js";
    }

}

CreateInternalPlan.template = 'bleaching_dept.createInternalPlanTemplate';
registry.category('actions').add('bleaching_dept.create_internal_plan_js', CreateInternalPlan);