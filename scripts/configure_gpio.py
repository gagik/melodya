import RPi.GPIO as GPIO  
GPIO.setmode(GPIO.BCM)     # set up BCM GPIO numbering  
GPIO.setup(16, GPIO.IN, pull_up_down=GPIO.PUD_UP)    
GPIO.setup(19, GPIO.IN, pull_up_down=GPIO.PUD_UP)    
GPIO.setup(26, GPIO.IN, pull_up_down=GPIO.PUD_UP)    