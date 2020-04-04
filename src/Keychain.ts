import keychain from 'xkeychain'

export type PasswordType = "generic" | "internet"

export function getPassword(
    account: string,
    service: string,
    type: PasswordType = "generic"
): Promise<string> {
    return new Promise((resolve, reject) => {
        var options = { account, service, type }
        keychain.getPassword(options, (err, password) => {
            if (err) {
                reject(err)
            } else {
                resolve(password)
            }
        })
    })
}

export function deletePassword(
    account: string,
    service: string,
    type: PasswordType = "generic"
): Promise<void> {
    return new Promise((resolve, reject) => {
        var options = { account, service, type }
        keychain.deletePassword(options, err => {
            if (err) {
                reject(err)
            } else {
                resolve()
            }
        })
    })
}

export function setPassword(
    account: string,
    service: string,
    password: string,
    type: PasswordType = "generic"
): Promise<void> {
    return new Promise((resolve, reject) => {
        var options = { account, service, password, type }
        keychain.setPassword(options, err => {
            if (err) {
                reject(err)
            } else {
                resolve()
            }
        })
    })
}