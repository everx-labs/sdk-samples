const { add0x, isNear, isValidPublicKey, isValidAddress } = require('../utils')

test('isNear', () => {
    expect(isNear('0x14ec45b02c', '10000000000')).toBeFalsy()
    expect(isNear('0x14ec45b02c', '89563335980')).toBeFalsy()
    expect(isNear('0x14ec45b02c', '89673335980')).toBeTruthy()
})

test('isValidPublicKey', () => {
    expect(isValidPublicKey('123')).toBeFalsy()
    expect(isValidPublicKey()).toBeFalsy()
    expect(isValidPublicKey('0000000000000000000000000000000000000000000000000000000000000000')).toBeFalsy()
    expect(isValidPublicKey('0x0000000000000000000000000000000000000000000000000000000000000000')).toBeFalsy()
    expect(isValidPublicKey('5a2b0e735571de2b762c74b88479819e5e2646d775a16b3e41e2ecac8262a6d3')).toBeTruthy()
    expect(isValidPublicKey('0x5a2b0e735571de2b762c74b88479819e5e2646d775a16b3e41e2ecac8262a6d3')).toBeTruthy()
})

test('isValidAddress', () => {
    expect(isValidAddress('123')).toBeFalsy()
    expect(isValidAddress()).toBeFalsy()
    expect(isValidAddress('0:5a2b0e735571de2b762c74b88479819e5e2646d775a16b3e41e2ecac8262a6d3')).toBeTruthy()
    expect(isValidAddress('10:5a2b0e735571de2b762c74b88479819e5e2646d775a16b3e41e2ecac8262a6d3')).toBeTruthy()
    expect(isValidAddress('-1:5a2b0e735571de2b762c74b88479819e5e2646d775a16b3e41e2ecac8262a6d3')).toBeTruthy()
    expect(isValidAddress('-123:5a2b0e735571de2b762c74b88479819e5e2646d775a16b3e41e2ecac8262a6d3')).toBeTruthy()
})

test('add0x', () => {
    expect(add0x('123')).toEqual('0x123')
    expect(add0x('0xabc')).toEqual('0xabc')
    expect(add0x('0')).toEqual('0x0')
    expect(add0x('')).toEqual('')
    expect(() => add0x(undefined)).toThrow()
    expect(() => add0x(null)).toThrow()
    expect(() => add0x(0)).toThrow()
    expect(() => add0x(1)).toThrow()
})
