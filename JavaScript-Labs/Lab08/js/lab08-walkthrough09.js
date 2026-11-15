/* code goes here */
var isCanadian = true;

function calculateTax(amount, tax) {
    return amount * tax();
}

function calculateTotal(price, quantity) {
    var subtotal = price * quantity;

    return subtotal + calculateTax(subtotal, function () {
        if (isCanadian) {
            return 0.05;
        }
        return 0;
    });
}