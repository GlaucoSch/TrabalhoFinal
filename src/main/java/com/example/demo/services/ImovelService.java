	package com.example.demo.services;
	
	import java.util.List;
	import java.util.Optional;
	
	import org.springframework.http.HttpStatus;
	import org.springframework.stereotype.Service;
	import org.springframework.web.server.ResponseStatusException;
	
	import com.example.demo.dtos.ImovelRequestDTO;
	import com.example.demo.models.BairroModel;
	import com.example.demo.models.ImovelModel;
	import com.example.demo.models.TipoImovelModel;
	import com.example.demo.repositories.BairroRepository;
	import com.example.demo.repositories.ImovelRepository;
	import com.example.demo.repositories.TipoImovelRepository;
	
	@Service
	public class ImovelService {
	    private final ImovelRepository repository;
	    private final BairroRepository bairroRepository;
	    private final TipoImovelRepository tipoImovelRepository;
	
	    public ImovelService(ImovelRepository repository, BairroRepository bairroRepository,
	            TipoImovelRepository tipoImovelRepository) {
	        this.repository = repository;
	        this.bairroRepository = bairroRepository;
	        this.tipoImovelRepository = tipoImovelRepository;
	    }
	
	    public List<ImovelModel> getAll() {
	        List<ImovelModel> list = repository.findAll();
	        return list;
	    }
	
	    public ImovelModel find(Integer id) {
	        Optional<ImovelModel> model = repository.findById(id);
	        return model.orElse(null);
	    }

	    public ImovelModel findWithDetails(Integer id) {
	        return repository.findWithDetailsById(id).orElse(null);
	    }
	
	    public ImovelModel insert(ImovelRequestDTO request) {
	        if (request.getTipoImovel() == null || request.getTipoImovel().getId() == null) {
	            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "tipoImovel.id é obrigatório");
	        }
	        if (request.getBairro() == null || request.getBairro().getId() == null) {
	            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "bairro.id é obrigatório");
	        }

	        TipoImovelModel tipoImovel = tipoImovelRepository.findById(request.getTipoImovel().getId())
	                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Tipo de imóvel não encontrado"));
	        BairroModel bairro = bairroRepository.findById(request.getBairro().getId())
	                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Bairro não encontrado"));

	        ImovelModel model = new ImovelModel();
	        model.setTitulo(request.getTitulo());
	        model.setDescricao(request.getDescricao());
	        model.setPrecoVenda(request.getPrecoVenda());
	        model.setPrecoAluguel(request.getPrecoAluguel());
	        model.setFinalidade(request.getFinalidade());
	        model.setStatus(request.getStatus());	
	        model.setDormitorios(request.getDormitorios());
	        model.setBanheiros(request.getBanheiros());
	        model.setGaragem(request.getGaragem());
	        model.setAreaTotal(request.getAreaTotal());
	        model.setAreaConstruida(request.getAreaConstruida());
	        model.setEndereco(request.getEndereco());
	        model.setNumero(request.getNumero());
	        model.setComplemento(request.getComplemento());
	        model.setCep(request.getCep());
	        model.setCaracteristicas(request.getCaracteristicas());
	        model.setDestaque(request.getDestaque());
	        model.setTipoImovel(tipoImovel);
	        model.setBairro(bairro);
	        return repository.save(model);
	    }
	 
	    public ImovelModel update(ImovelModel model) {
	        try {
	            if(find(model.getId())!=null){
	                return repository.save(model);
	            }
	            return null;
	        } catch (Exception e) {
	            return null;
	        }
	
	    }

	    public ImovelModel updateStatus(Integer id, String status) {
	        ImovelModel model = repository.findById(id)
	                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Imóvel não encontrado"));
	        model.setStatus(status);
	        return repository.save(model);
	    }
	
	    public void delete(Integer id) {
	        repository.deleteById(id);
	    }
	}
	