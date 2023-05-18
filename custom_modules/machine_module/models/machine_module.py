from odoo import models, api, fields

class MachineDetails(models.Model):
    _name = "machine.data"
    _inherit = ["mail.thread",'mail.activity.mixin']
    _description = "Machines Data"

    machineName = fields.Char(string='Machine Name', tracking=True)
    ppLotNum = fields.Char(string='PP Lot Num', tracking=True)
    fabricType = fields.Selection([('flat','Flat'),('lycra','Lycra')], string='Fabric Type', tracking=True)
    quality = fields.Char(string='Quality', tracking=True)
    shade = fields.Char(string='Shade', tracking=True)
    jobCard = fields.Char(string='Job Card', tracking=True)
    greyMeter = fields.Char(string='Grey Meter', tracking=True)
    contract = fields.Char(string='Contract', tracking=True)
    planApprove = fields.Boolean(string='PPC Plan Approve', default=False , tracking=True)
    departmentNames = fields.Selection([('finishing','Finishing'),('dying','Dying')], string='Departments', tracking=True)
    executionApproval = fields.Boolean(string='Machine Execution Approval', default=False , tracking=True)
    reprocess = fields.Boolean(string='Reprocess', default=False , tracking=True)
    machineRoute = fields.Char(string='Machine Route')




    # age = fields.Integer(string='Age' , tracking=True)
    # dept = fields.Char(string='Department' , tracking=True)
    # active = fields.Boolean(string='Active', default=True , tracking=True)
    # wfh = fields.Boolean(string='Work From Home', default=False , tracking=True)
    # review = fields.Selection([('0','Bad'),('1','Normal'),('2','Good'),('3','Great')], string="Employee Reviews" , tracking=True, default='3')
    #

# class MachineParams(models.Model):
#     _name = "machine.params"
#     _description = "Machine Parameters"
#
#     nameOfMachine = fields.Char(string='Machine Name', required= True)
#     machines = fields.Selection([('0','Bad'),('1','Normal'),('2','Good'),('3','Great')], string="Employee Reviews" , tracking=True, default='3')
#
#     machineSpeed = fields.Char(string='Machine Speed')
#     flamePressure = fields.Char(string='Flame Pressure')
#     chemicalTemp = fields.Char(string='Chemical Temperature')
#     positionBurner = fields.Char(string='Position Burner')
#     burnerDistance = fields.Char(string='Burner Distance')
#     fabricTemp = fields.Char(string='Fabric Temperature')
#     rotationTime = fields.Char(string='Rotation Time')
#     brushing1 = fields.Char(string='Brushing 1')
#     brushing2 = fields.Char(string='Brushing 2')
#     brushing3 = fields.Char(string='Brushing 3')
#     machinePreventiveMaintenance = fields.Boolean(string='Machine Preventive Maintenance', default=False)
#     machineRoute= fields.Char(string='Machine Route')


class MachinesDetails(models.Model):
    _name = "machine.details"
    _description = "Machine Details"

    subMachines = fields.Char(string='Machine Name', required= True)
    nameOfMachines = fields.Selection([('unrolling','Unrolling'),('sienging','Sienging'),('lbox','LBox'),
                             ('mercerizing','Mercerizing'),('curing','Curing'),('laffer','Laffer'),('danti','Danti'),
                             ('suckermuler','Suckermuler'),('raising','Raising & Shearing')], string="Machine Names",required= True)
    underMaintenance = fields.Boolean(string='Machine Under Maintenance', default=False)
