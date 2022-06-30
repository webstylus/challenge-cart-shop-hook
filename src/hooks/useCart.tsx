import {createContext, ReactNode, useContext, useEffect, useRef, useState} from 'react';
import {toast} from 'react-toastify';
import {api} from '../services/api';
import {Product, Stock} from '../types';

interface CartProviderProps {
    children: ReactNode;
}

interface UpdateProductAmount {
    productId: number;
    amount: number;
}

interface CartContextData {
    cart: Product[];
    addProduct: (productId: number) => Promise<void>;
    removeProduct: (productId: number) => void;
    updateProductAmount: ({productId, amount}: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({children}: CartProviderProps): JSX.Element {
    const [cart, setCart] = useState<Product[]>(() => {
        const storagedCart = localStorage.getItem('@RocketShoes:cart')

        if (storagedCart) {
            return JSON.parse(storagedCart);
        }

        return [];
    });

    const preveCartRef = useRef<Product[]>()

    useEffect(() => {
        preveCartRef.current = cart
    })

    const cartPreviousValue = preveCartRef.current ?? cart

    useEffect(() => {
        if (cartPreviousValue !== cart){
            localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart))
        }
    }, [cart, cartPreviousValue])

    const addProduct = async (productId: number) => {
        try {
            // TODO
            const updateCart = [...cart]
            const productExist = updateCart.find(product => product.id === productId)
            const {data} = await api.get(`/stock/${productId}`)
            const stockAmount = data.amount
            const currentAmount = productExist ? productExist.amount : 0
            const amount = currentAmount + 1

            if (amount > stockAmount) {
                toast.error("Quantidade solicitada fora de estoque")
                return
            }

            if (productExist) {
                productExist.amount = amount
            } else {
                const {data} = await api.get(`/products/${productId}`)
                const newProduct = {
                    ...data,
                    amount: 1
                }
                updateCart.push(newProduct)
            }
            setCart(updateCart)
        } catch {
            // TODO
            toast.error('Erro na adição do produto');
        }
    };

    const removeProduct = (productId: number) => {
        try {
            // TODO
            const updatedCart = [...cart]
            const productIndex = updatedCart.findIndex(product => product.id === productId)

            if (productIndex >= 0) {
                updatedCart.splice(productIndex, 1)
                setCart(updatedCart)
            } else {
                throw Error()
            }
        } catch (e) {
            toast.error('Erro na remoção do produto');
        }
    };

    const updateProductAmount = async ({productId, amount,}: UpdateProductAmount) => {
        try {
            // TODO
            if (amount <= 0){
                return
            }
            const {data} = await api.get(`stock/${productId}`)
            const stockAmount = data.amount

            if(amount > stockAmount) {
                toast.error('Quantidade solicitada fora de estoque');
                return
            }

            const updatedCart = [...cart]
            const productExist = updatedCart.find(product => product.id === productId)
            if (productExist) {
                productExist.amount = amount
                setCart(updatedCart)
            } else {
                throw Error()
            }
        } catch {
            toast.error('Erro na alteração de quantidade do produto');
        }
    };

    return (
        <CartContext.Provider
            value={{cart, addProduct, removeProduct, updateProductAmount}}
        >
            {children}
        </CartContext.Provider>
    );
}

export function useCart(): CartContextData {
    const context = useContext(CartContext);

    return context;
}
