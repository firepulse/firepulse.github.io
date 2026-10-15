/*___________________________________________________________________________________________________

Title:
	OnVFD.h v1.0

Description:
	Driver for interfacing AVR microcontrollers with ET16312N VFD Controller
	
	For complete details visit:
	https://www.programming-electronics-diy.xyz/2017/06/vfd-vacuum-fluorescent-diplay-driver-library.html

Author:
 	Liviu Istrate
	istrateliviu24@yahoo.com

Donate:
	Software development takes time and effort so if you find this useful consider a small donation at:
	paypal.me/alientransducer
_____________________________________________________________________________________________________*/


/* ----------------------------- LICENSE - GNU GPL v3 -----------------------------------------------

* This license must be included in any redistribution.

* Copyright (c) 2017 Liviu Istrate, www.programming-electronics-diy.xyz (istrateliviu24@yahoo.com)

* Project URL: https://www.programming-electronics-diy.xyz/2017/06/vfd-vacuum-fluorescent-diplay-driver-library.html
* Inspired from: http://www.instructables.com/id/A-DVD-Player-Hack

* This program is free software: you can redistribute it and/or modify
* it under the terms of the GNU General Public License as published by
* the Free Software Foundation, either version 3 of the License, or
* (at your option) any later version.

* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
* GNU General Public License for more details.

* You should have received a copy of the GNU General Public License
* along with this program. If not, see <https://www.gnu.org/licenses/>.

--------------------------------- END OF LICENSE --------------------------------------------------*/

#ifndef ET16312N_H
#define ET16312N_H

/*************************************************************
	INCLUDES
**************************************************************/
#include <avr/io.h>
#include <util/delay.h>

/*************************************************************
	SETUP
**************************************************************/
// MCU IO
#define VFD_PIN_PORT			PIND
#define VFD_CS_DDR				DDRD
#define VFD_CS_PORT				PORTD
#define VFD_CS_PIN				PD2
#define VFD_SCLK_DDR			DDRD
#define VFD_SCLK_PORT			PORTD
#define VFD_SCLK_PIN			PD3
#define VFD_DATA_DDR			DDRD
#define VFD_DATA_PORT			PORTD
#define VFD_DATA_PIN			PD4
// VFD Display settings
#define VFD_SEGMENTS 			15
#define VFD_DIGITS 				7
#define VFD_BYTES_PER_DIGIT 	2
#define VFD_DIMMING_MAX 		7		// From 0 to 7
// Utils Settings (Optional)
#define VFD_SCROLL_SPEED		200		// In milliseconds
// Write 1 to enable the following functions
#define ENABLE_READ_SW_AND_KEY			1	// Enables functions to read SW and KEYs
#define ENABLE_TEXT_SCROLL				1	// Function for scrolling a text
#define ENABLE_DISPLAY_ALL_FONTS		1	// Display and scroll all available characters
#define ENABLE_MENU_INTERFACE_RELATED	1	// Enables VFDBlinkUserInput function
#define ENABLE_BUSY_INDICATOR			1	// Enables VFDBusySpinningCircle function
#define ENABLE_SEGMENTS_TEST			1	// A function to test segment numbering

/*************************************************************
	MACROS
**************************************************************/
#define INPUT							&= ~
#define OUTPUT							|=
#define HIGH							|=
#define LOW								&= ~
#define pinMode(DDR, PIN, MODE)			(DDR MODE (1 << PIN))
#define digitalWrite(PORT, PIN, MODE)	(PORT MODE (1 << PIN))

#define true							1
#define false							0

// VFD Library Macros
#define VFDWriteStringPosition(string, position){\
	VFDSetCursorPosition(position);\
	VFDWriteString(string);\
}

#define VFDWriteIntPosition(number, nrOfDigits, position, displayColonSymbol){\
	VFDSetCursorPosition(position);\
	VFDWriteInt(number, nrOfDigits, displayColonSymbol);\
}

#define VFDSetBrightness(BRIGHTNESS)	VFDcommand(0x88 | (BRIGHTNESS & VFD_DIMMING_MAX), 1)
#define VFDdisplayOn(DIMMING)			VFDcommand(0x88 | (DIMMING & VFD_DIMMING_MAX), 1)
#define VFDdisplayOff()					VFDcommand(0x80, 1)
#define VFDHome()						VFDSetCursorPosition(1)
#define VFDDegreeSymbol()				VFDDisplayNonASCII(64)

/*************************************************************
	GLOBALS
**************************************************************/
typedef uint8_t bool;
uint8_t cursorPositionX = 0;

#if ENABLE_MENU_INTERFACE_RELATED == 1
static uint8_t characterBlinkDelay = 0;
static uint8_t cursorPosBuffer = 0;
static uint8_t blinkedLengthBuffer = 0;
static bool writeToLastString = true;
char lastStringDisplayed[VFD_DIGITS] = {' '};
#endif

// Segment numbering for ET16312n VFD driver
//         7
//	   ---------
//    |\   |   /| 
//  2 | 5  6  4 | 3 
//    |  \ | /  |
//    -16--9--1--
//    |   /|\   |
// 14 | 13 6 12 | 15
//    | /  |  \ |
//	   ---------
//         11
//
// ASCII codes
#define VFD_COLON_SYMBOL_BIT	10
const uint8_t FONTS[65][2] = {
	{0b00000000, 0b00000000}, // space 0x20
	{0b00000000, 0b00000000}, // ! N/A
	{0b00000000, 0b00000000}, // " N/A
	{0b00000000, 0b00000000}, // # N/A
	{0b11000101, 0b01100011}, // $ (bits 16, 15, 11, 9, 7, 6, 2, 1)
	{0b00000000, 0b00000000}, // % N/A
	{0b00000000, 0b00000000}, // & N/A
	{0b00000000, 0b00000000}, // ' N/A
	{0b00001001, 0b00001000}, // ( (bits 12, 9, 4)
	{0b00010001, 0b00010000}, // ) (bits 13, 9, 5)
	{0b10011001, 0b00111001}, // * (bits 16, 13, 12, 9, 6, 5, 4, 1)
	{0b10000001, 0b00100001}, // + (bits 16, 9, 6, 1)
	{0b00000000, 0b00000000}, // , N/A
	{0b10000001, 0b00000001}, // - (bits 16, 9, 1)
	{0b00000001, 0b00000000}, // . (bit 9)
	{0b00010001, 0b00001000}, // / (bits 13, 9, 4)
	{0b01110100, 0b01001110}, // 0 (bits 15, 14, 13, 11, 7, 4, 3, 2)
	{0b01000000, 0b00001100}, // 1 (bits 15, 4, 3)
	{0b10100101, 0b01000101}, // 2 (bits 16, 14, 11, 9, 7, 3, 1)
	{0b11000101, 0b01000101}, // 3 (bits 16, 15, 11, 9, 7, 3, 1)
	{0b11000001, 0b00000111}, // 4 (bits 16, 15, 9, 3, 2, 1)
	{0b11000101, 0b01000011}, // 5 (bits 16, 15, 11, 9, 7, 2, 1)
	{0b11100101, 0b01000011}, // 6 (bits 16, 15, 14, 11, 9, 7, 2, 1)
	{0b00010001, 0b01001000}, // 7 (bits 13, 9, 7, 4)
	{0b11100101, 0b01000111}, // 8 (bits 16, 15, 14, 11, 9, 7, 3, 2, 1)
	{0b11000101, 0b01000111}, // 9 (bits 16, 15, 11, 9, 7, 3, 2, 1)
	{0b00000010, 0b00000000}, // : (bit 10)  available for 3-th and 5-th digits only
	{0b00000000, 0b00000000}, // ; N/A
	{0b00001000, 0b00001000}, // < (bits 12, 4)
	{0b10000101, 0b00000001}, // = (bits 16, 11, 9, 1)
	{0b00010000, 0b00010000}, // > (bits 13, 5)
	{0b00000000, 0b00000000}, // ? N/A
	{0b00000000, 0b00000000}, // @ N/A
	{0b11100001, 0b01000111}, // A (bits 16, 15, 14, 9, 7, 3, 2, 1)
	{0b01000101, 0b01100101}, // B (bits 15, 11, 9, 7, 6, 3, 1)
	{0b00100100, 0b01000010}, // C (bits 14, 11, 7, 2)
	{0b01000101, 0b01100100}, // D (bits 15, 11, 9, 7, 6, 3)
	{0b10100101, 0b01000011}, // E (bits 16, 14, 11, 9, 7, 2, 1)
	{0b10100001, 0b01000010}, // F (bits 16, 14, 9, 7, 2)
	{0b01100100, 0b01000011}, // G (bits 15, 14, 11, 7, 2, 1)
	{0b11100001, 0b00000111}, // H (bits 16, 15, 14, 9, 3, 2, 1)
	{0b00000001, 0b00100000}, // I (bits 9, 6)
	{0b01100100, 0b00000100}, // J (bits 15, 14, 11, 3)
	{0b10101001, 0b00001010}, // K (bits 16, 14, 12, 9, 4, 2)
	{0b00100100, 0b00000010}, // L (bits 14, 11, 2)
	{0b01100000, 0b00011110}, // M (bits 15, 14, 5, 4, 3, 2)
	{0b01101001, 0b00010110}, // N (bits 15, 14, 12, 9, 5, 3, 2)
	{0b01100100, 0b01000110}, // O (bits 15, 14, 11, 7, 3, 2)
	{0b10100001, 0b01000111}, // P (bits 16, 14, 9, 7, 3, 2, 1)
	{0b01101100, 0b01000110}, // Q (bits 15, 14, 12, 11, 7, 3, 2)
	{0b10101001, 0b01000111}, // R (bits 16, 14, 12, 9, 7, 3, 2, 1)
	{0b11000101, 0b01000011}, // S (bits 16, 15, 11, 9, 7, 2, 1)
	{0b00000001, 0b01100000}, // T (bits 9, 7, 6)
	{0b01100100, 0b00000110}, // U (bits 15, 14, 11, 3, 2)
	{0b00110000, 0b00001010}, // V (bits 14, 13, 4, 2)
	{0b01111001, 0b00000110}, // W (bits 15, 14, 13, 12, 9, 3, 2)
	{0b00011001, 0b00011000}, // X (bits 13, 12, 9, 5, 4)
	{0b00010001, 0b00011000}, // Y (bits 13, 9, 5, 4)
	{0b00010101, 0b01001000}, // Z (bits 13, 11, 9, 7, 4)
	{0b00100100, 0b01000010}, // [ (bits 14, 11, 7, 2)
	{0b00001001, 0b00010000}, // \ (bits 12, 9, 5)
	{0b01000100, 0b01000100}, // ] (bits 15, 11, 7, 3)
	{0b00000000, 0b00000000}, // ^ N/A
	{0b00000100, 0b00000000}, // _ (bits 11)
    
	//Special non-standard symbols
	{0b10000001, 0b01000111}  // degree (bits 16, 9, 7, 3, 2, 1) (index 64)
};

/*************************************************************
	FUNCTION PROTOTYPES
**************************************************************/
void VFDInitialise(void);
void VFDWriteString(const char *string);
void VFDWriteInt(int16_t number, int8_t nrOfDigits, bool displayColonSymbol);
void VFDSetCursorPosition(uint8_t position);
void VFDClear(void);
void VFDControlLEDs(uint8_t leds);
void VFDDisplayNonASCII(uint8_t index);

#if ENABLE_MENU_INTERFACE_RELATED == 1
void VFDBlinkUserInput(uint8_t cursorStartPosition, uint8_t length);
#endif

#if ENABLE_DISPLAY_ALL_FONTS == 1
void VFDdisplayAllFonts(void);
#endif

#if ENABLE_TEXT_SCROLL == 1 || ENABLE_DISPLAY_ALL_FONTS == 1
void VFDscrollText(const char *string);
#endif

#if ENABLE_BUSY_INDICATOR == 1
void VFDBusySpinningCircle(void);
#endif

#if ENABLE_SEGMENTS_TEST == 1
void VFDSegmentsTest(void);
#endif

#if ENABLE_READ_SW_AND_KEY == 1
uint8_t VFDReadKey(void);
uint8_t VFDReadKeyButton(uint8_t delay);
uint8_t VFDReadSW(void);
static uint8_t VFDReadData(void);
#endif

static void VFDcommand(uint8_t value, bool cmd);

/*************************************************************
	FUNCTIONS
**************************************************************/
void VFDInitialise(void){
	pinMode(VFD_CS_DDR, VFD_CS_PIN, OUTPUT);
	pinMode(VFD_SCLK_DDR, VFD_SCLK_PIN, OUTPUT);
	pinMode(VFD_DATA_DDR, VFD_DATA_PIN, OUTPUT);
	
	// Waiting for the VFD driver to startup
	_delay_ms(1000);
	
	// Set display mode
	#if VFD_DIGITS == 4
		VFDcommand(0x00, 1); // 4 digits, 16 segments
	#elif VFD_DIGITS == 5
		VFDcommand(0x01, 1); // 5 digits, 16 segments
	#elif VFD_DIGITS == 6
		VFDcommand(0x02, 1); // 6 digits, 16 segments
	#elif VFD_DIGITS == 7
		VFDcommand(0x03, 1); // 7 digits, 15 segments
	#elif VFD_DIGITS == 8
		VFDcommand(0x04, 1); // 8 digits, 14 segments
	#elif VFD_DIGITS == 9
		VFDcommand(0x05, 1); // 9 digits, 13 segments
	#elif VFD_DIGITS == 10
		VFDcommand(0x06, 1); // 10 digits, 12 segments
	#elif VFD_DIGITS == 11
		VFDcommand(0x07, 1); // 11 digits, 11 segments
	#endif
	
	// Set cursor position to 1 (display address to 0x00) and clear the display
	VFDClear();
	
	// Turn on the display
	VFDdisplayOn(VFD_DIMMING_MAX);
	
	#if ENABLE_MENU_INTERFACE_RELATED == 1
		uint8_t i;
		for(i=0; i<VFD_DIGITS; i++){
			lastStringDisplayed[i] = ' ';
		}
	#endif
}

//-------------- VFDWriteString ------------------------------------------------
void VFDWriteString(const char *string){
	uint8_t cmd = 0x40;
	uint8_t chrset;
	//uint8_t cursorBuffer = cursorPositionX;
	
	// Let the chip driver increment memory address?
	/*if(inc_address == 0){
		cmd |= (1 << 2); // cmd becomes 0x44
	}*/
	
	// Tells the driver that we want to write to it's memory
	VFDcommand(cmd, false);
	
   while(*string > '\0'){
		#if ENABLE_MENU_INTERFACE_RELATED == 1
		if(writeToLastString){
			// Store the string to be used by the VFDBlinkUserInput function
			if(cursorPositionX <= VFD_DIGITS && *string != ':'){
				lastStringDisplayed[cursorPositionX-1] = *string;
			}
		}
		#endif
		
		if(*string == ':'){
			digitalWrite(VFD_CS_PORT, VFD_CS_PIN, HIGH);
			VFDSetCursorPosition(cursorPositionX - 1);
			string--;
			VFDcommand(cmd, false);
			// Send MSB
			chrset = FONTS[*string - 0x20][0];
			chrset |= 1 << (VFD_COLON_SYMBOL_BIT - 9);
			VFDcommand(chrset, false);
			// Send LSB
			chrset = FONTS[*string - 0x20][1];
			VFDcommand(chrset, false);
			string++;
		}else{
			// Send MSB
			chrset = FONTS[*string - 0x20][0];
			VFDcommand(chrset, false);
			// Send LSB
			chrset = FONTS[*string - 0x20][1];
			VFDcommand(chrset, false);
		}
		
		//if(inc_address)	cursorPositionX++;
		cursorPositionX++;
		string++;
	}
	
	// Signal the driver that the data transmission is over
	digitalWrite(VFD_CS_PORT, VFD_CS_PIN, HIGH);
	
	// Restore cursor
	//if(inc_address == 0) VFDSetCursorPosition(cursorBuffer);
}

//-------------- VFDWriteInt ------------------------------------------------
void VFDWriteInt(int16_t number, int8_t nrOfDigits, bool displayColonSymbol){
	char string[7] = {0};
	uint8_t isNegative = false, length = 0, divide;
	int16_t copyOfNumber = number;
	
	// Find number of digits
	while(copyOfNumber != 0){ 
		length++;
		copyOfNumber /= 10;
	}
	
	copyOfNumber = number;
	nrOfDigits -= length;
	
	if(nrOfDigits < 0) nrOfDigits = 0;
		
	if(number < 0){
		isNegative = 1;
		copyOfNumber = 0 - copyOfNumber;
		length++;
	}
	
	for(divide = length + nrOfDigits; divide > 0; divide--){
		string[divide-1] = (copyOfNumber % 10) + '0';
		copyOfNumber /= 10;
	}
	
	if(displayColonSymbol){
		string[length + nrOfDigits] = ':';
	}
	
	if(isNegative) string[0] = '-';
	
	VFDWriteString(string);
}

//-------------- VFDSetCursorPosition ------------------------------------------------
void VFDSetCursorPosition(uint8_t position){
	if(position > VFD_DIGITS){
		if(position == VFD_DIGITS + 1){
			position = 1;
		}else{
			position = VFD_DIGITS;
		}
	}else if(position == 0){
		position = VFD_DIGITS;
	}
	
	cursorPositionX = position;
	
	position = (position * VFD_BYTES_PER_DIGIT) - VFD_BYTES_PER_DIGIT;
	VFDcommand(0xC0 | (position & 0x1F), true);
}

//-------------- VFDClear ------------------------------------------------------------
void VFDClear(void){
	uint8_t i;
	char string[VFD_DIGITS+1] = {' '};
	
	#if ENABLE_MENU_INTERFACE_RELATED == 1
	writeToLastString = false;
	#endif
	
	for(i=0; i<VFD_DIGITS; i++){
		string[i] = ' ';
	}
	
	VFDSetCursorPosition(1);
	VFDWriteString(string);
	VFDSetCursorPosition(1);
	
	#if ENABLE_MENU_INTERFACE_RELATED == 1
	writeToLastString = true;
	#endif
}

//-------------- VFDControlLEDs ------------------------------------------------------------
void VFDControlLEDs(uint8_t leds){
	uint8_t i;
	uint8_t leds_value = 0xFF;
	
	VFDcommand(0x41, false);
	
	// 0 means led is On and 1 means Off for the VFD controller so we invert the bits
	for(i=0; i<8; i++){
		if((1 << i) & leds) leds_value &= ~(1 << i);
	}
	
	VFDcommand(leds_value, true);
}

//-------------- VFDDisplayNonASCII ------------------------------------------------------------
void VFDDisplayNonASCII(uint8_t index){
	VFDcommand(0x40, false);
	VFDcommand(FONTS[index][0], false);
	VFDcommand(FONTS[index][1], true);
}

#if ENABLE_READ_SW_AND_KEY == 1
//-------------- VFDReadKey ------------------------------------------------------------
uint8_t VFDReadKey(void){
	VFDcommand(0x42, false);
	_delay_us(1);
	
	return VFDReadData();
}

static uint8_t BUTTON_PRESS_DELAY_COUNT = 0;
//-------------- VFDReadKeyButton ------------------------------------------------------------
uint8_t VFDReadKeyButton(uint8_t delay){
	uint8_t btn_nr = 0, pressed_btn = 0;
	BUTTON_PRESS_DELAY_COUNT++;
	
	// Return the button number
	if(BUTTON_PRESS_DELAY_COUNT > delay){
		BUTTON_PRESS_DELAY_COUNT = 0;
		pressed_btn = 0b11111110 & VFDReadKey();
		if(pressed_btn > 1){
			while((1 << btn_nr & pressed_btn) == 0) btn_nr++;
			return btn_nr;
		}
	}
	
	return 0;
}

//-------------- VFDReadSW ------------------------------------------------------------
uint8_t VFDReadSW(void){
	VFDcommand(0x43, false);
	_delay_us(1);
	
	return VFDReadData();
}

//-------------- VFDReadData ------------------------------------------------------------
uint8_t VFDReadData(void){
	// Make DATA pin input HIGH
	VFD_DATA_DDR &= ~(1 << VFD_DATA_PIN);
	VFD_DATA_PORT |= 1 << VFD_DATA_PIN;
	
	digitalWrite(VFD_SCLK_PORT, VFD_SCLK_PIN, HIGH);
	digitalWrite(VFD_CS_PORT, VFD_CS_PIN, LOW);
	
	uint8_t i;
	uint8_t data_in = 0xFF;
	for(i=0; i<8; i++){
		digitalWrite(VFD_SCLK_PORT, VFD_SCLK_PIN, LOW);
		
		if(bit_is_set(VFD_PIN_PORT, VFD_DATA_PIN))
			data_in |= (1 < i);
		else
			data_in &= ~(1 << i);
			
		digitalWrite(VFD_SCLK_PORT, VFD_SCLK_PIN, HIGH);
	}
	
	// DATA pin as OUTPUT
	VFD_DATA_DDR |= 1 << VFD_DATA_PIN;
	digitalWrite(VFD_CS_PORT, VFD_CS_PIN, HIGH);
	
	return data_in;
}
#endif

//-------------- VFDcommand ------------------------------------------------------------
void VFDcommand(uint8_t value, bool cmd){
	digitalWrite(VFD_CS_PORT, VFD_CS_PIN, LOW);
	
	uint8_t i;
	for(i=0; i<8; i++){
		if(value & (1 << i)){
			digitalWrite(VFD_DATA_PORT, VFD_DATA_PIN, HIGH);
		}else{
			digitalWrite(VFD_DATA_PORT, VFD_DATA_PIN, LOW);
		}
		
		digitalWrite(VFD_SCLK_PORT, VFD_SCLK_PIN, LOW);
		digitalWrite(VFD_SCLK_PORT, VFD_SCLK_PIN, HIGH);
	}
	
	if(cmd) digitalWrite(VFD_CS_PORT, VFD_CS_PIN, HIGH);
}



//================================= UTILS ====================================
#if ENABLE_MENU_INTERFACE_RELATED == 1
void VFDBlinkUserInput(uint8_t cursorStartPosition, uint8_t length){
	uint8_t space = 0, delaysPerFrame = 60, i, currentCursorP, underscore = 0;
	
	if((characterBlinkDelay == delaysPerFrame) || (characterBlinkDelay == delaysPerFrame * 2)){
		char toBlinkString[length];
		writeToLastString = false;
		
		// Step 1: replace the characters with spaces
		if(characterBlinkDelay == delaysPerFrame){
			// Save current cursor position and length because they can change
			// before the function restores the values
			cursorPosBuffer = cursorStartPosition;
			blinkedLengthBuffer = length;
			
			// Replace with a space
			for(i=0; i<length; i++){
				toBlinkString[i] = ' ';
			}
			
			toBlinkString[length] = '\0';
			space = true;
		}
		
		// Step 2: restore the characters
		if(characterBlinkDelay == delaysPerFrame * 2){
			if(lastStringDisplayed[cursorPosBuffer - 1] < 33){
				lastStringDisplayed[cursorPosBuffer - 1] = '_';
				underscore = true;
			}
			
			characterBlinkDelay = 0;
		}
		
		// Fix cursor 0 or > VFD_DIGITS
		VFDSetCursorPosition(cursorPositionX);
		
		// Save current cursor position
		currentCursorP = cursorPositionX;
		
		if(space){
			VFDSetCursorPosition(cursorPosBuffer);
			VFDWriteString(toBlinkString);
		}else{
			VFDHome();
			VFDWriteString(lastStringDisplayed);
		}
		
		VFDSetCursorPosition(currentCursorP);
		
		if(underscore) lastStringDisplayed[cursorPosBuffer - 1] = ' ';
		writeToLastString = true;
	}
	
	characterBlinkDelay++;
	_delay_ms(5);
}
#endif

#if ENABLE_DISPLAY_ALL_FONTS == 1
void VFDdisplayAllFonts(void){
	uint8_t i, j=0;
	uint8_t arrayLength = ((sizeof(FONTS) / sizeof(uint8_t)) / 2);
	char string[arrayLength];
	
	for(i=0; i<arrayLength; i++){
		if(FONTS[i][0] && FONTS[i][1] > 0){
			string[j] = i + 0x20;
			j++;
		}
	}
	
	VFDscrollText(string);
}
#endif

#if ENABLE_TEXT_SCROLL == 1 || ENABLE_DISPLAY_ALL_FONTS == 1
void VFDscrollText(const char *string){
	const char *string_start_pos = string;
	uint8_t charsToDisplay = 0;
	uint8_t shift_pos = 0;
	uint8_t msb, lsb;
	uint8_t string_size = 0;
	
	// Find the string length
	while(*string > '\0'){
		string_size++;
		string++;
	}
	
	while(shift_pos < (string_size + VFD_DIGITS)){
		if(shift_pos < VFD_DIGITS){
			VFDSetCursorPosition(VFD_DIGITS - shift_pos);
			charsToDisplay = shift_pos + 1;
			string = string_start_pos;
		}else{
			VFDSetCursorPosition(1);
			charsToDisplay = VFD_DIGITS;
			string = string_start_pos + (shift_pos - VFD_DIGITS) + 1;
		}
		
		// Tells the driver that we want to write to it's memory
		VFDcommand(0x40, false);
			
		while(charsToDisplay){
			if(*string == '\0'){
				msb = 0x00;
				lsb = 0x00;
			}else{
				msb = FONTS[*string - 0x20][0];
				lsb = FONTS[*string - 0x20][1];
			}
			
			// Send MSB
			VFDcommand(msb, false);
			// Send LSB
			VFDcommand(lsb, false);
			
			if(*string > '\0') string++;
			charsToDisplay--;
		}
		
		// Signal the driver that the data transmission is over
		digitalWrite(VFD_CS_PORT, VFD_CS_PIN, HIGH);
		
		shift_pos++;
		_delay_ms(VFD_SCROLL_SPEED);
	}
	
	VFDSetCursorPosition(1);
}
#endif

#if ENABLE_BUSY_INDICATOR == 1
static uint8_t BUSY_INDICATOR_DELAY_COUNT = 1;
static uint8_t BUSY_INDICATOR_FRAME = 1;
static uint8_t BUSY_INDICATOR_LOOP_NR = 0;

void VFDBusySpinningCircle(void){
	uint8_t msb = 0x00, lsb = 0x00;
	uint8_t seg2_duty_cycle = 2, seg3_duty_cycle = 5, seg4_duty_cycle = 12;
	
	if(BUSY_INDICATOR_DELAY_COUNT == 2){
		seg2_duty_cycle = BUSY_INDICATOR_LOOP_NR % seg2_duty_cycle;
		seg3_duty_cycle = BUSY_INDICATOR_LOOP_NR % seg3_duty_cycle;
		seg4_duty_cycle = BUSY_INDICATOR_LOOP_NR % seg4_duty_cycle;
		
		if(BUSY_INDICATOR_FRAME == 1){
			if(seg3_duty_cycle == 0){
				msb = 1 << (16 - 8 - 1); // segment 16 (3)
			}
			if(seg4_duty_cycle == 0){
				msb |= 1 << (13 - 8 - 1); // segment 13 (4)
			}
			lsb = 1 << (4 - 1); // segment 4 (first) (1)
			if(seg2_duty_cycle == 0){
				lsb |= 1 << (5 - 1); // segment 5 (2)
			}
		}else if(BUSY_INDICATOR_FRAME == 2){
			if(seg4_duty_cycle == 0){
				msb = 1 << (16 - 8 - 1); // segment 16 (4)
			}
			lsb = 1 << (1 - 1); // segment 1 (second) (1)
			if(seg2_duty_cycle == 0){
				lsb |= 1 << (4 - 1); // segment 4 (2)
			}
			if(seg3_duty_cycle == 0){
				lsb |= 1 << (5 - 1); // segment 5 (3)
			}
		}else if(BUSY_INDICATOR_FRAME == 3){
			msb = 1 << (12 - 8 - 1); // segment 12 (third) (1)
			if(seg2_duty_cycle == 0){
				lsb = 1 << (1 - 1); // segment 1 (2)
			}
			if(seg3_duty_cycle == 0){
				lsb |= 1 << (4 - 1); // segment 4 (3)
			}
			if(seg4_duty_cycle == 0){
				lsb |= 1 << (5 - 1); // segment 5 (4)
			}
		}else if(BUSY_INDICATOR_FRAME == 4){
			msb = 1 << (13 - 8 - 1); // segment 13 (fourth) (1)
			if(seg2_duty_cycle == 0){
				msb |= 1 << (12 - 8 - 1); // segment 12 (2)
			}
			if(seg3_duty_cycle == 0){
				lsb = 1 << (1 - 1); // segment 1 (3)
			}
			if(seg4_duty_cycle == 0){
				lsb |= 1 << (4 - 1); // segment 4 (4)
			}
		}else if(BUSY_INDICATOR_FRAME == 5){
			msb = 1 << (16 - 8 - 1); // segment 16 (fifth) (1)
			if(seg2_duty_cycle == 0){
				msb |= 1 << (13 - 8 - 1); // segment 13 (2)
			}
			if(seg3_duty_cycle == 0){
				msb |= 1 << (12 - 8 - 1); // segment 12 (3)
			}
			if(seg4_duty_cycle == 0){
				lsb |= 1 << (1 - 1); // segment 1 (4)
			}
		}else if(BUSY_INDICATOR_FRAME == 6){
			if(seg3_duty_cycle == 0){
				msb = 1 << (13 - 8 - 1); // segment 13 (3)
			}
			if(seg2_duty_cycle == 0){
				msb |= 1 << (16 - 8 - 1); // segment 16 (2)
			}
			if(seg4_duty_cycle == 0){
				msb |= 1 << (12 - 8 - 1); // segment 12 (4)
			}
			lsb = 1 << (5 - 1); // segment 5 (sixth) (1)
		}
		
		BUSY_INDICATOR_DELAY_COUNT = 0;
		BUSY_INDICATOR_LOOP_NR++;
		if(BUSY_INDICATOR_LOOP_NR == 70){
			if(BUSY_INDICATOR_FRAME == 6) BUSY_INDICATOR_FRAME = 0;
			BUSY_INDICATOR_FRAME++;
			BUSY_INDICATOR_LOOP_NR = 0;
		}
		
		VFDcommand(0x40, false);
		VFDcommand(msb, false);
		VFDcommand(lsb, true);
		VFDSetCursorPosition(cursorPositionX);
	}
	
	BUSY_INDICATOR_DELAY_COUNT++;
	
	_delay_ms(1);
}
#endif

#if ENABLE_SEGMENTS_TEST == 1
void VFDSegmentsTest(void){
	uint8_t i, msb = 0x00, lsb = 0x00;
	
	for(i=0; i<16; i++){
		if(i < 8){
			lsb = 1 << i;
		}else{
			msb = 1 << (i - 8);
			lsb = 0x00;
		}
		
		// Go to digit 1
		VFDSetCursorPosition(1);
		// Display a segment
		VFDcommand(0x40, false);
		VFDcommand(msb, false);
		VFDcommand(lsb, true);
		
		// Display current segment number
		VFDSetCursorPosition(3);
		VFDWriteInt((i + 1), 2, true);
		
		_delay_ms(2000);
	}
}
#endif

#endif