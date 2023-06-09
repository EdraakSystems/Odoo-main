# -*- coding: utf-8 -*-
{
    'name': 'PPC',
    'sequence': 0,
    'author': 'Ateeq Ur Rehman',
    'version': '0.0.0.1',
    'category': 'Production Planning',
    'summary': 'PPC ERP Module',
    'description': """PPC ERP Module""",
    'depends': ['base', 'mail', 'web', 'web_notify'],
    'data': [
        'C:/Edraak/Odoo main/odoo project 2/custom_modules/ppc/security/ir.model.access.csv',
        'C:/Edraak/Odoo main/odoo project 2/custom_modules/ppc/views/ppc_view.xml',
        'C:/Edraak/Odoo main/odoo project 2/custom_modules/ppc/security/ppc_security.xml'
    ],
    'demo': [],
    'application':True,
    'installable': True,
    'auto_install': False,
    'assets': {
        'web.assets_backend': [
            'ppc/static/css_main/css_main.css',
            'ppc/static/src/ppc_order_view/js/ppc_order_view.js',
            'ppc/static/src/ppc_order_view/xml/ppc_order_view.xml',
            'ppc/static/src/ppc_order_view/css/ppc_order_view.css'
        ],
    },
    'license': 'LGPL-3'
}
