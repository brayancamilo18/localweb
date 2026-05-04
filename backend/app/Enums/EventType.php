<?php

namespace App\Enums;

enum EventType: string
{
    case Visit = 'visit';
    case WhatsappClick = 'whatsapp_click';
    case PhoneClick = 'phone_click';
}
