GBannotate
===========

Create annotation for GB / GBC ROM files


Testing
-------

To test this project:

$ php -S localhost:9000

And with a browser:

http://localhost:9000/


Now you must generate a TXT version of your ROM with the *xxd* command (Unix based machines) like so:

         $ xxd -ps file.gb > file.gb.txt

Now copy paste *file.gb.txt* into the textarea and hit *run*
