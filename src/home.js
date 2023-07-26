import KEYS from './keys/keys.js';

// Declaracion de las variables del DOM
const $products = document.getElementById('products');
const $template = document.getElementById('template').content;
const $fragment = document.createDocumentFragment();

// Autenticacion
const options = {
	headers: {
		Authorization: `Bearer ${KEYS.private}`,
	},
};

// Variables para guardar los datos de las respuestas
let products, prices;


// Funcion para formatear el precio
const formatPrice = (num) => `$ ${num.slice(0, 2)}.${num.slice(2, 5)},${num.slice(-2)}`;

// Se realiza las peticiones juntas con Promise.all() y se guardan en un array
Promise.all([
	fetch('https://api.stripe.com/v1/products', options),
	fetch('https://api.stripe.com/v1/prices', options),
])
	.then(responses =>
		// se verifica si el status de la respuestas estan en OK.
		Promise.all(
			responses.map(res => {
				return res.ok ? res.json() : Promise.reject(res);
			}),
		),
	)
	.then(resData => {
		// Se guardan las respuestas en las variables
		products = resData[0].data; // La posicion 0 es la respuestas de la peticion de productos
		prices = resData[1].data; // La posicion 1 es la respuestas de la peticion de precios

		prices.map(price => {
			// se crea un nuevo objeto con las condiciones de la funcion del filter
			let productData = products.filter(product => product.id === price.product);


			$template.querySelector('.card-product').setAttribute('data-price', price.id )
			$template.querySelector('img').setAttribute('src', `${productData[0].images[0]}`);
			$template.querySelector('figcaption').innerHTML = `<span> <h5> ${productData[0]
				.name}</h5><h4>${formatPrice(price.unit_amount_decimal)}</h4></span>`;

			// Se clona el template y se importa el node para agregarlo al fragmnet
			let $cloneTemplate = document.importNode($template, true);
			$fragment.appendChild($cloneTemplate);
		});

		$products.appendChild($fragment);
	})
	.catch(err => {
		let messageError = err.statusText || 'Ocurrio un problema en la peticion';
		$products.insertAdjacentHTML(
			'afterend',
			`ERROR ${err.status}: ${messageError}`,
		);
	});



	// Evento al dar click en la tarjeta del prodcuto redirecciona a la pagina de pago 
	document.addEventListener('click', e => {

		// Valida si el evento se origino en una carta de un producto
		if(e.target.matches('.btn-product')) {

			// Obtiene el data-attribute con el id del precio del producto
			let priceId = e.target.parentElement.getAttribute('data-price')


			// Redirecciona a la pagina de pago de stripe
			Stripe(KEYS.public)
			.redirectToCheckout({
				lineItems: [{ price: priceId, quantity: 1 }],
				mode: 'payment',
				successUrl: 'http://127.0.0.1:5500/src/pages/success.html',
				cancelUrl: 'http://127.0.0.1:5500/src/pages/cancel.html'
			})
			.then(res => {
				if (res.error) {
					$products.insertAdjacentHTML('afterend', res.error.message);
				}
			});
		}
	})