const {validateUniversityEmail} = require('../server/src/services/authServices');

describe('User Story 01 - Google Sign In With University email', () =>{

    test('accepts a valid university student email', () =>{
        expect(validateUniversityEmail('bradley.smith@students.wits.ac.za')).toBe(true);
    });

    test('reject a personal Gmail address',()=>{
        expect(validateUniversityEmail('bradley.smith@gmail.com')).toBe(false);
    });

    test('rejects a different university email', ()=>{
        expect(validateUniversityEmail('nkosinathi.khumalo@students.uct.za')).toBe(false);
    });

    test('rejects an invalid email', ()=>{
        expect(validateUniversityEmail('invalidEmail')).toBe(false);
    });
    
    test('rejects an empty string', ()=>{
        expect(validateUniversityEmail('')).toBe(false);
    });

    test('rejects null without throwing', ()=>{
        expect(validateUniversityEmail(null)).toBe(false);
    });

    test('domain is case insensitive', ()=>{
        expect(validateUniversityEmail('nkosinathi.khumalo@STUDENTS.WITS.AC.ZA')).toBe(true);
    });

});