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
            orders:[],
            internalPlanOrders : [],
            machineRout:[],
        });
        onWillStart(async () => {
            this.state.machineRout = await this.orm.searchRead("order.data", [], ["id", "machineRoute"]);
            this.state.orders = await this.orm.searchRead('order.data', [['status', '=', 'Bleaching Manager Approved']], ['ppLot', 'id']);
            this.state.internalPlanOrders = await this.orm.searchRead('order.data', [['status', '=', 'Added To Internal Plan']], ['ppLot', 'id', "machineRoute"]);

            console.log('this.state.orders : ', this.state.machineRout);

            await this.reloadInternalApprovedPlan();
            await this.checkOrdersWithMachineRoute();
        });
        this.state.notification =useService("notification");
        this.addOrder = this.addOrder.bind(this);
        this.loadInternalOrders = this.loadInternalOrders.bind(this);
        this.redirectToSetParamsScreen = this.redirectToSetParamsScreen.bind(this);
        this.reloadInternalApprovedPlan = this.reloadInternalApprovedPlan.bind(this);
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
    }

    async loadInternalOrders(){
        this.state.internalPlanOrders = await this.orm.searchRead('order.data', [['status', '=', 'Added To Internal Plan']], ['ppLot', 'id']);
        console.log('this.state.internalPlanOrders : ', this.state.internalPlanOrders);
    }

    redirectToSetParamsScreen(ev) {
        const selectedIdForRoute = ev.target.getAttribute('data-machine-id');
        console.log("Selected Id from Sending Page: ", selectedIdForRoute)
        const url = new URL("/web#action=machine_module.machine_params_screen_js", window.location.origin);
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


    async reloadInternalApprovedPlan() {
        let data = await this.orm.searchRead("order.data", [], ["id", "machineRoute"]);

        let machinesData = this.state.machineRout;
        data = data.map((item)=>{
            return ({
                ...item,
                machineRoute : item?.machineRoute!="" ?item.machineRoute?.split(",").map((route,index)=>({index,...machinesData.filter((machine)=>+machine.id==+route)[0]})) :[]
            })
        })
        console.log({data})
    }

    async checkOrdersWithMachineRoute() {
        try {
            const ordersWithMachineRoute = await this.orm.searchRead(
                'order.data',
                [['status', '=', 'Added To Internal Plan'], ['machineRoute', '!=', false]],
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
            this.state.machineRout = ordersInfoWithMachineRoute
            console.log('Orders with machineRoute:', this.state.machineRout);
        } catch (error) {
            console.error('Error while checking orders with machineRoute:', error);
        }
    }
}

CreateInternalPlan.template = 'bleaching_dept.createInternalPlanTemplate';
registry.category('actions').add('bleaching_dept.create_internal_plan_js', CreateInternalPlan);