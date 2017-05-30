#!/usr/bin/perl -w

use strict;
use warnings;
use CGI;
use HTML::Template;
use JSON;
use DBI;

require "config.pl";

my $db = getDB();
my $host = getHost();
my $user = getUser();
my $myPassword = getPassword();

my $dbh = DBI->connect("DBI:mysql:database=$db:host=$host", $user, $myPassword) or die $DBI::errstr;
$dbh->{RaiseError} = 1;
my $ct = $dbh->do("CREATE TABLE IF NOT EXISTS `appointments` (
  `apptTime` datetime NOT NULL,
  `apptDesc` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;");
my $q = CGI->new;
main();

## Subroutines
sub main {
    my  $searchString = $q->param('searchString');
 
    if (defined $searchString) {  # Our AJAX call
        getAppointments($searchString);
    } else {   # Not our AJAX call, load the page
        showIndex();
    }
}

sub showIndex {
        my $date = $q->param('date');
        my $time = $q->param('time');
        my $desc = $q->param('desc');   
        print $q->header;
        my $errors = '';
        if ((defined $date) && (defined $time) && (defined $desc)) {  # Form submission
            my $apptTime = $date.' '.$time.':00';
            my $apptDesc = $desc;
            my $th = $dbh->prepare("SELECT COUNT(1) FROM appointments WHERE apptTime=?"); # Make sure we dont have an appt at this date and time
            $th->execute($apptTime);
            if ($th->fetch()->[0]) {
                $errors .= "You already have an appointment schedule at this time.  Please choose a different date and time.<br>"
            } else {
                my $sth = $dbh->prepare( "INSERT INTO appointments (apptTime, apptDesc) VALUES (?, ?);");
                $sth->execute($apptTime, $apptDesc);
            };
        }
        $dbh->disconnect();
        my $html = showHTML($errors);
        print $html;
}

sub showHTML {
    my $template = HTML::Template->new(filename => 'index.tmpl');
    $template->param(errors => @_);
    return $template->output();
}

sub getAppointments {
    print $q->header(-type => "application/json", -charset => "utf-8");
    my ($searchString) = @_;
    my $sth;
    if ($searchString ne 'undefined') {
        $sth = $dbh->prepare('SELECT * FROM appointments WHERE apptDesc LIKE ?');
        $sth->execute("%$searchString%");
    } else {
        $sth = $dbh->prepare("SELECT * FROM appointments;");
        $sth->execute();
    }
    my $json = {}; 
    while (my @row = $sth->fetchrow_array) {
        $json->{$row[0]} = $row[1];
    }
    print to_json($json);
}