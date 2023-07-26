# -*- coding: utf-8 -*-
{
    'name': 'Bleaching Dept',
    'sequence': 0,
    'author': 'Ateeq Ur Rehman',
    'version': '0.0.0.2',
    'category': 'Production Planning',
    'summary': 'PPC ERP Module',
    'description': """PPC ERP Module""",
    'depends': ['base', 'mail', 'web', 'web_notify'],
    'data': [
        'C:/Edraak/Odoo main/odoo project 2/custom_modules/bleaching_dept/security/ir.model.access.csv',
        'C:/Edraak/Odoo main/odoo project 2/custom_modules/bleaching_dept/views/bleaching_dept.xml',
        'C:/Edraak/Odoo main/odoo project 2/custom_modules/bleaching_dept/views/machine_types.xml',
        'C:/Edraak/Odoo main/odoo project 2/custom_modules/bleaching_dept/views/bleaching_machines.xml',
    ],
    'demo': [],
    'application':True,
    'installable': True,
    'auto_install': False,
    'assets': {
        'web.assets_backend': [
            'bleaching_dept/static/src/create_internal_plan/js/create_internal_plan.js',
            'bleaching_dept/static/src/create_internal_plan/xml/create_internal_plan.xml',
            'bleaching_dept/static/src/create_internal_plan/css/create_internal_plan.css',
            'bleaching_dept/static/src/order_selction_for_internal_plan/js/order_selction_for_internal_plan.js',
            'bleaching_dept/static/src/order_selction_for_internal_plan/xml/order_selction_for_internal_plan.xml',
            'bleaching_dept/static/src/order_selction_for_internal_plan/css/order_selction_for_internal_plan.css',
            'bleaching_dept/static/src/machine_route/js/machine_route.js',
            'bleaching_dept/static/src/machine_route/xml/machine_route.xml',
            'bleaching_dept/static/src/machine_route/css/machine_route.css',
            'bleaching_dept/static/src/machine_params/js/machine_params.js',
            'bleaching_dept/static/src/machine_params/xml/machine_params.xml',
        ],
    },
    'license': 'LGPL-3'
}
