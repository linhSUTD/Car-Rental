
function showPopup(title, text, time)
{

    $.gritter.add({
        title: title,
        text: text || " ",
        time: time || 2000
    });
}

var URL = {
    PORTAL:             '/',
    HOMEPAGE:           '/homepage.html',
    LOGIN:              '/#/login',
    ADMIN_CMS:          '/admin.html',
    PROVIDER_CMS:       '/provider.html',
    PUBLIC_CMS:         '/public.html'
}

var Properties = {
    EMAIL_COOKIE: 'email_cookie',


    /// User Role
    PUBLIC_USER:  'Public',
    ADMIN_USER:   'Admin',
    PROVIDER:     'Provider'
}


var getLocation = function (callback) {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function (position) {
            //getting result done
            return callback(position);
        }, function (error) {
            //error getting position
            var x = null;

            console.log(error);
            switch (error.code) {
                case error.PERMISSION_DENIED:
                    x = "User denied the request for Geolocation."
                    break;
                case error.POSITION_UNAVAILABLE:
                    x = "Location information is unavailable."
                    break;
                case error.TIMEOUT:
                    x = "The request to get user location timed out."
                    break;
            }
            alert(x);
        });
    } else {
        alert("Geolocation is not supported by this browser.");
    }
}

var isNullOrEmpty = function (input) {
    if (input == '' || input == null) {
        return true;
    }

    return false;
}
