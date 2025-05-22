App = {
  web3Provider: null,
  contracts: {},
  account: '0x0',

  init: async function () {
    // Load pets.
    $.getJSON('../pets.json', function (data) {
      var petsRow = $('#petsRow');
      var petTemplate = $('#petTemplate');

      for (i = 0; i < data.length; i++) {
        petTemplate.find('.panel-title').text(data[i].name);
        petTemplate.find('img').attr('src', data[i].picture);
        petTemplate.find('.pet-breed').text(data[i].breed);
        petTemplate.find('.pet-age').text(data[i].age);
        petTemplate.find('.pet-location').text(data[i].location);
        petTemplate.find('.btn-adopt').attr('data-id', data[i].id);

        petsRow.append(petTemplate.html());
      }
    });

    return await App.initWeb3();
  },

  initWeb3: async function () {
    if (typeof web3 !== 'undefined') {
      // If a web3 instance is already provided by MetaMask
      App.web3Provider = web3.currentProvider;
      web3 = new Web3(web3.currentProvider);
    } else {
      // Specify default instance if no web3 instance provided
      App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
      web3 = new Web3(App.web3Provider);
    }
    return App.initContract();
  },

  initContract: async function () {
    $.getJSON('Adoption.json', function (data) {
      // Get the necessary contract artifact file and instantiate it with truffle-contract
      var AdoptionArtifact = data;
      App.contracts.Adoption = TruffleContract(AdoptionArtifact);

      // Set the provider for our contract
      App.contracts.Adoption.setProvider(App.web3Provider);

      // Use our contract to retrieve and mark the adopted pets
      return App.markAdopted();
    });

    return App.bindEvents();
  },

  bindEvents: function () {
    $(document).on('click', '.btn-adopt', App.handleAdopt);
  },

  markAdopted: async function () {
    const adoptionInstance = await App.contracts.Adoption.deployed();

    try {
      const adopters = await adoptionInstance.getAdopters.call();

      for (let i = 0; i < adopters.length; i++) {
        if (adopters[i] !== '0x0000000000000000000000000000000000000000') {
          $('.panel-pet').eq(i).find('button').text('Success').attr('disabled', true);
        }
      }
    } catch (err) {
      console.log(err.message);
    }
  },

  handleAdopt: async function (event) {
    event.preventDefault();

    const petId = parseInt($(event.target).data('id'));
    const adoptionInstance = await App.contracts.Adoption.deployed();

    try {
      // Get current account
      const accounts = await web3.eth.getAccounts();
      App.account = accounts[0];

      // Execute adopt as a transaction by sending account
      await adoptionInstance.adopt(petId, { from: App.account });

      // Update UI
      $('.panel-pet').eq(petId).find('button').text('Success').attr('disabled', true);
    } catch (err) {
      console.log(err.message);
    }
  }
};

$(function () {
  $(window).load(function () {
    App.init();
  });
});
