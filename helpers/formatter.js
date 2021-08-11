const phoneNumberFormatter = function(num) {
// Menghilangkan karakter selain angka
    let formatted = num.replace(/\D/g, '');

// Mengganti angka (0) di depan (prefix) dan diganti menjadi 62 (kode negara)
    if (formatted.startsWith('0')) {
        formatted = '62' + formatted.substr(1);
    }
    
    if (!formatted.endsWith('@const.us')) {
        formatted += '@c.us';
    }
//
    return formatted;

}

module.exports = {
    phoneNumberFormatter
}