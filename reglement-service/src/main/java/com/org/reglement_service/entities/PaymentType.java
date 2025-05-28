package com.org.reglement_service.entities;

public enum PaymentType {
    ESPECE,  // Cash
    CHEQUE,  // Check
    TRAITE,  // Draft
    CARTE,   // Credit/Debit Card
    VIREMENT // Bank Transfer
}