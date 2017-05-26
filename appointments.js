$(document).ready(function() {
    function getAppointments(searchString) {
        $('#appointments').hide();
        $('#appts tbody > tr').remove();
        
        $.ajax({
            type: "GET",
            url: "index.pl",
            dataType: "json",
            data: "searchString=" + searchString,
            
            error: function(XMLHttpRequest, textStatus, errorThrown) { 
                $('#errorDiv').text("responseText: " + XMLHttpRequest.responseText 
                    + ", textStatus: " + textStatus 
                    + ", errorThrown: " + errorThrown);
            }, // error 

            success: function(data){
                if (data.error) { // script returned error
                    $('#errorDiv').text("data.error: " + data.error);
                } else { // getAppointment AJAX was successful
                    appts = [];
                    for (var item in data) {
                        appts.push({date: item, desc: data[item]});
                    };
                    if (appts.length>0){
                        appts.sort(function(a, b) { // Sort our appts because perl returns an unsorted hash
                            return new Date(a.date) - new Date(b.date);
                        });
                        var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
                        $('#appointments').show();
                        appts.forEach(function (item) { // Prepare appts for display
                            var items = item['date'].split(" ");
                            var t = item['date'].split(/[- :]/);
                            var date = months[t[1]-1]+' '+t[2];
                            var hour, meridiem;
                            if (t[3]>=12) {
                                if (t[3]==12){
                                    hour = t[3];
                                } else {
                                    hour = t[3] - 12;
                                }
                                    meridiem = 'pm';
                            } else {
                                hour = +t[3];
                                meridiem = 'am';
                                if (hour==0) {
                                    hour = 12;
                                }
                            }
                            var time = hour+':'+t[4]+meridiem;
                            $('#appts tbody').append('<tr><td>'+date+'</td><td>'+time+'</td><td>'+item['desc']+'</td></tr>');
                        });
                    }
                }
            }
        });
    }

    function isDate(txtDate) {
        if(txtDate == '')
            return false;
        var rxDatePattern = /^(\d{4})(\-)(\d{1,2})(\-)(\d{1,2})$/;
        var dtArray = txtDate.match(rxDatePattern);
        if (dtArray == null)
            return false;

        var dtMonth = dtArray[3];
        var dtDay= dtArray[5];
        var dtYear = dtArray[1];
        if (dtMonth < 1 || dtMonth > 12)
            return false;
        else if (dtDay < 1 || dtDay> 31)
            return false;
        else if ((dtMonth==4 || dtMonth==6 || dtMonth==9 || dtMonth==11) && dtDay ==31)
            return false;
        else if (dtMonth == 2)
        {
            var isleap = (dtYear % 4 == 0 && (dtYear % 100 != 0 || dtYear % 400 == 0));
            if (dtDay>29 || (dtDay==29 && !isleap))
                return false;
        }
        return true;
    }

    function isTime(txtTime) {
        var rxTimePattern = /^([01]?\d|2[0-3]):([0-5]\d)\s?(AM|PM|A|P)?$/i;
        var tArray = txtTime.match(rxTimePattern);
        if (tArray == null) {
            return false;
        }
        return true;
    }

    $('#date').datepicker({minDate: 0, dateFormat: "yy-mm-dd"});

    $('#newButton').click(function(e) {
        e.preventDefault();
        $('#newButton').hide();
        $('#addForm').show();
    });
    
    $('#cancelButton').click(function(e) {
        e.preventDefault();
        $('#newButton').show();
        $('#addForm').hide();
    })
    
    $('#addButton').click(function(e) {
        var date = $('#date').val();
        var time = $('#time').val();

        if (!isDate(date)){
            alert('Please enter a valid date in YYYY-MM-DD format');
            e.preventDefault();
            return;
        }
        if (!isTime(time)){
            alert('Please enter a valid time in HH:MM format.  You may use 24 hour time or add am or pm to the time.');
            e.preventDefault();
            return;
        }
        
        // Format time for our DB
        time = time.split(':');
        minutes = time[1];
        minutes = minutes.split(/(\d+)/).filter(Boolean)
        hour = +time[0];
        if ((minutes[1].toLowerCase().indexOf('p')>=0) && (hour>12)) { // PM hours, ignoring 12pm
                hour = hour + 12;       
        } else if (hour==12) {  // 12am
            hour = 0;
        }        
        // Update form with formatted time
        $('#time').val(hour+':'+minutes[0]);        
    })
    
    $('#searchButton').click(function(e) {
        e.preventDefault();
        var searchString = $('#searchBox').val();
        getAppointments(searchString);
    })
    
    getAppointments();
})