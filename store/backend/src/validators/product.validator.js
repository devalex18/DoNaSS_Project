const { body, validationResult } = require('express-validator');
const validateCreateProduct = [

    body('name')
        .notEmpty().withMessage('Product name is required.')
        .isString().withMessage('Product name must be a valid string.')
        .trim(),
    
    body('department')
        .notEmpty().withMessage('Department is required.')
        .isString().withMessage('Department must be a valid string.')
        .trim(),

    body('price')
        .notEmpty().withMessage('Price is required.')
        .isNumeric().withMessage('Price must be a number.')
        .custom((value) => value >= 0).withMessage('Price cannot be negative.'),

    body('stock')
        .notEmpty().withMessage('Initial stock is required.')
        .isInt({ min: 0 }).withMessage('Stock must be an integer greater than or equal to zero.'),

    body('minStockLevel')
        .notEmpty().withMessage('Minimum stock level is required.')
        .isInt({ min: 0 }).withMessage('Minimum stock level must be an integer greater than or equal to zero.'),

    body('supplierId')
        .notEmpty().withMessage('Supplier is required.')
        .isInt().withMessage('Supplier ID must be a valid number.'),

        body('variants')
        .isArray({ min: 1 }).withMessage('At least one variant (size and color) is required.'),

    body('variants.*.size')
        .notEmpty().withMessage('Variant size is required.')
        .isString().withMessage('Variant size must be a string.'),

    body('variants.*.color')
        .notEmpty().withMessage('Variant color is required.')
        .isString().withMessage('Variant color must be a string.'),

    body('variants.*.stock')
        .notEmpty().withMessage('Variant stock is required.')
        .isInt({ min: 0 }).withMessage('Variant stock must be an integer greater than or equal to zero.'),

    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                status: 'error',
                errors: errors.array() 
            });
        }
        next();
    }
];

module.exports = {
    validateCreateProduct,
};